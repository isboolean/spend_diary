# 记账本 发布上线全流程复盘

> 记录 2026-11-03 从服务器准备到 APK 交付的完整过程，含每一步的判断依据和踩过的坑。
> 目标读者：需要重复这套发布流程的人（包括未来的自己）。

---

## 0. 全局图景

这个项目有**三个客户端 + 一个后端**，发布时要分清哪些东西需要上线、哪些只在本地：

| 模块 | 形态 | 发布方式 |
|---|---|---|
| `server/` | Spring Boot 单体，jar | 上传到服务器，systemd 托管 |
| `admin-web/` | React 静态站（含 PC 用户端 + `/admin` 后台） | 构建成 `dist`，nginx 托管 |
| `app/` | Expo / React Native 原生 App | 云构建出 APK，用户自行安装 |

### 服务器上的实际布局

```
公网 :8080  ──►  nginx  ──┬──►  /opt/spend_diary/dist        （静态前端，SPA 回退 index.html）
                          └──►  127.0.0.1:8081              （/api/ 反向代理）
                                    │
                                    └──► Spring Boot (server.jar, systemd)
                                              │
                                              └──► 127.0.0.1:3306 MySQL 8
```

**为什么是 8080 而不是 80**：这台机器 80 端口已被现有的 Caddy 占用（跑着另一个 Hermes Agent 服务）。发布新项目时**不要动别人的服务**，换端口是最小侵入的做法。同理，因为机器上没有 Docker，也没有必要为了用 `docker-compose.yml` 去装一套 Docker——直接用 systemd + nginx，少一层依赖，排错也更直接。

---

## 阶段一：服务器准备

### 1.1 先体检，再动手

任何部署之前先摸清现状，避免"装完了才发现端口被占/内存不够/版本不对"：

需要确认的项：操作系统与版本、CPU/内存/磁盘、已安装的运行时（Java/Node/Docker）、监听中的端口、已有的 Web 服务。

本次体检结论：

- Ubuntu 24.04，2 核 2G + 2G swap，磁盘充足
- **Java 17 已装**（不用重复安装，省一步）
- **MySQL 8 已在本机运行**（不用装数据库，只需建库建账号）
- **没有 Docker**，也**没有 nginx**
- **80 端口被 Caddy 占用** → 决定本项目改用 8080

这一步的价值在于：后面所有决策都是根据体检结果做的，而不是照抄一份通用教程。

### 1.2 建立一条可写的通道

这里踩了一个坑：云控制台提供的"远程命令执行"能力**只有只读权限**——查询类命令能跑，写文件、装软件、改配置一律被安全策略拒绝。也就是说它适合做诊断，**不能用来部署**。

真正部署必须有 SSH。实际过程中还有两个细节：

1. 密钥要装到正确的用户下。这台机器 **root 用户不接受密钥登录**，但 `ubuntu` 用户可以，并且 `ubuntu` 有免密 sudo。所以把公钥写进 `ubuntu` 的 `authorized_keys`，后续所有特权操作走 `sudo`。
2. 生成一把**专用密钥**用于这个项目，不要复用日常密钥，便于日后单独吊销。

> 排查技巧：登录被拒时用 `ssh -v` 看详细握手过程，能直接看出"密钥没被服务器接受"还是"用户不对"，比反复试密码快得多。
> 补充观察：日志里显示的公钥是被写进了 `/home/ubuntu/.ssh/`，说明控制台登录的默认用户就是 ubuntu，这点和"用 root 登录"的直觉不一致。

### 1.3 构建并上传产物

本地构建出两个东西，一起打包上传：

- 后端：`mvn -DskipTests package` 产出 `server-0.0.1-SNAPSHOT.jar`
- 前端：`npm run build` 产出 `admin-web/dist/`

> 坑：本地有两个调试用的 Java 进程正占用着 jar 文件，导致重新打包失败（Windows 文件锁）。当时的处理是**在独立目录里重新构建**，而不是去杀用户的调试进程——不擅自终止用户正在用的东西。另外发现原 jar 比 `schema.sql` 旧，说明之前没重新编译过，这种"产物比源码旧"的情况上线后会出现诡异的表结构问题，构建前值得对一下时间戳。

上传用 `scp` 走刚才那把专用密钥，服务器侧解压到 `/opt/spend_diary/`。

### 1.4 用脚本把服务器配置固化下来

`deploy/lighthouse/deploy.sh` 是这次的核心产物。它**幂等**（可以反复执行，用于首次部署和后续升级），按顺序做七件事：

| 步骤 | 做什么 | 为什么这么做 |
|---|---|---|
| 1 | 检查并安装 JRE / nginx | 只装缺的，已装的不动 |
| 2 | 建目录、校验产物存在 | 产物缺失就早失败，别等到服务起不来 |
| 3 | 建库 + 建**专用数据库账号** | 不让应用拿 root 连库，符合最小权限 |
| 4 | 生成运行环境变量文件 | **JWT 密钥用 `openssl rand -hex 48` 随机生成** |
| 5 | 写 systemd 单元并启动 | 开机自启、崩溃自动重启 |
| 6 | 写 nginx 站点配置 | 8080 托管前端 + 反代 `/api/` |
| 7 | 自检 | 本地 curl 前端和接口，拿不到 200 就报错退出 |

几个值得单独说明的设计：

**JWT 密钥必须随机生成。** 原项目 `application.yml` 里写的是 `${JWT_SECRET:dev-only-secret-...}`，而 `docker-compose.yml` 根本没传这个变量——意味着生产环境会静默使用仓库里公开的默认密钥，任何看到代码的人都能伪造任意用户的 token。这是整个项目最严重的安全问题。部署脚本把它改成了服务器本地随机生成、权限 600、只有 root 可读。

**JVM 参数要按内存配。** 服务用的是 `-Xms128m -Xmx448m -XX:+UseSerialGC`。2G 内存的小机器上，默认堆大小会让 JVM 吃掉大半内存，MySQL 再一分就没有余量了；小堆 + SerialGC 是这种规格下更稳的选择。

**环境变量放独立文件。** 数据库密码、JWT 密钥写在 `/etc/spend-diary/env`（700 目录 + 600 文件），systemd 通过 `EnvironmentFile` 读取。好处是密钥不进代码库、不进命令行（命令行参数在 `ps` 里可见）。

**nginx 要改监听端口，不能删别人的配置。** 脚本只删除 `sites-enabled/default`（nginx 自带的欢迎页），自建配置写在 `conf.d/spend_diary.conf`，监听 8080。80 上的 Caddy 完全不受影响。

**SPA 必须做 history 回退。** `try_files $uri $uri/ /index.html;` 这一行不能少，否则用户刷新 `/home` 这类前端路由会直接 404。

### 1.5 放行端口

云服务器的防火墙默认只开了 22（SSH）、80（HTTP）、ICMP。8080 是新端口，**必须显式添加规则**，否则服务器本地 curl 通、公网访问不通——这种"本地好使、外面连不上"的现象基本都是防火墙或安全组没放行。

只新增 8080/TCP 一条规则，不动已有的 22/80，避免把自己锁在门外。

### 1.6 从公网验收

验收要在**公网侧**做，不能只看服务器本地：

```
前端   http://62.234.131.142:8080/            → 200
接口   POST /api/v1/app/auth/login（错密码）   → 业务码 1002 用户名或密码错误
未授权 GET /api/v1/app/auth/me                → 401
```

看到 `1002` 这个业务码其实是**好事**：说明请求真的打到了 Spring Boot、走到了鉴权逻辑、并按项目约定返回了业务错误，而不是被 nginx 或防火墙拦在外面返回 502/403。

---

## 阶段二：让 App 指向服务器

App 是原生应用，接口地址在**打包时**就被编译进 JS bundle 了，不是运行时读配置。所以要改两处：

**1. 接口地址** — `app/.env.production`：

```
EXPO_PUBLIC_API_URL=http://62.234.131.142:8080
```

`EXPO_PUBLIC_` 前缀的变量会被 Expo 在打包时注入到客户端代码里。

**2. 允许明文 HTTP** — `app/app.json` 增加：

```json
["expo-build-properties", { "android": { "usesCleartextTraffic": true } }]
```

这条**必须加**。Android 9（API 28）以后默认禁止明文 HTTP，不加这个配置，App 一联网就被系统拦掉，表现为"一直转圈/网络错误"，而且日志里不一定有明显提示。

同时补上 `android.package = com.spenddiary.app`，这是 Android 应用的唯一标识，打包必需。

---

## 阶段三：打 APK

这一段是本次耗时最长的部分，结论先写：**Windows 本地打 RN 0.88 的 APK 走不通，改走云构建。**

### 本地路线为什么失败

连续五轮失败，根因不止一个，按层次分：

| 层次 | 问题 | 处理 |
|---|---|---|
| 网络/代理 | 本机走 `127.0.0.1:49901` 代理，但 **Java 不读代理环境变量**；gradle.org 证书链 JDK 校验失败；Maven 拉 `react-android` 超时 | 给 Gradle 配代理；改用国内镜像下 Gradle 9.4.1；Maven 换阿里云镜像 |
| 工具链 | SDK platform 37、build-tools、CMake 缺失或下载被代理截断 | 手动指定包名安装，清理半成品目录后重装 |
| **平台限制（死结）** | 见下 | 无法在本地解决 |
| 会话 | Gradle daemon 被外部终止 | 重跑 |

**死结的具体成因**：React Native 0.88 的新架构（`newArchEnabled=true`，SDK 58 已强制）会用 codegen 生成 C++ 目标，而 **C++ object 文件名里嵌了源文件的绝对路径**。完整路径 = CMake 工作目录 + `react_codegen_xxx.dir/` 前缀 + 源文件绝对路径，实测拼接后 **278 字符**，超过 Windows 的 260 字符上限，ninja 建目录直接失败。

几个尝试过的缓解手段和结果：

- 把工程从 `D:\workspace\spend_diary\app` 复制到 `D:\sd` → 仍超（前缀+源路径本身就接近 260）
- 开注册表 `LongPathsEnabled=1` → **对 ninja 无效**，因为它需要在可执行文件的 manifest 里声明 `longPathAware` 才认这个开关
- 关掉新架构 → 不可行，RN 0.88 已移除旧架构

还有一个很隐蔽的坑值得记下来：复制工程时把 `android/build/generated/autolinking/autolinking.json` 一起带走了，这个文件里**写死了原路径**。Gradle 靠 package.json 的哈希判断"配置没变"，于是直接复用这个旧文件，导致即使在新目录构建，源码仍被指回旧路径。排查时对比两个文件大小完全一致才反应过来——**换目录必须清掉 build 产物和生成文件**。

### 换成云构建

EAS（Expo Application Services）是 Expo 官方的云构建服务，跑在 Linux 机器上，**没有 260 字符限制**，同时省掉本地整套 Android SDK / NDK / CMake。

准备配置 `app/eas.json`：

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "env": {
        "EXPO_PUBLIC_API_URL": "http://62.234.131.142:8080",
        "NODE_ENV": "production"
      }
    }
  }
}
```

三个关键点：

- `buildType: "apk"` —— 默认产出的是 `AAB`（上架商店用），**必须显式指定 apk** 才能直接安装
- `env` 里再写一遍接口地址 —— 不依赖 `.env` 文件是否被打包上传，双保险
- `distribution: "internal"` —— 内部分发，不需要走商店审核

再建一个 `app/.easignore`，明确排除 `android/`、`node_modules/`、`build/`、`.cxx/`：

```
node_modules/
android/
ios/
.expo/
dist/
web-build/
.kotlin/
.gradle/
.cxx/
build/
*.jks
*.keystore
*.log
```

这一步很重要：排除本地 `android/` 后，云端会**重新生成**原生工程，本地那些带旧路径的脏缓存一点都带不上去。

### 构建与验收

```
npx eas-cli build -p android --profile preview --non-interactive
```

实测耗时：排队 10 分钟（免费额度要排队）+ 实际编译 18 分钟 ≈ 30 分钟。构建在云端进行，**本机关机不影响**，产物保存在 Expo 的构建记录里。

产物拿到后做了四项校验，缺一不可：

| 校验项 | 怎么查 | 本次结果 |
|---|---|---|
| 签名有效 | `apksigner verify --verbose` | v2 方案通过（v1 为 false 属正常，现代 APK 用 v2/v3） |
| 包名/版本 | `aapt2 dump badging` | `com.spenddiary.app` / v1.0.0 / minSdk 24 |
| 明文 HTTP 权限 | `aapt2 dump xmltree` 查 `usesCleartextTraffic` | `true` |
| **接口地址是否真的打进去了** | 解压读 `assets/index.android.bundle` 搜 IP | 命中 `http://62.234.131.142:8080` |

第四项最容易被忽略，也最关键——前三项都过了但地址没打进去的包，装上去就是个连不上服务器的砖头。

---

## 阶段四：交付后必须知道的一件事

**第一个注册的用户会自动成为 ADMIN。** 源码里是 `userMapper.count() == 0` 时就赋管理员角色。所以：自己先注册占住管理员账号，或者**不要把注册入口公开**。多实例部署时这个判断还存在并发竞态。

---

## 下次发布怎么做

### 只更新服务端（后端/前端代码有改动）

```
1. 本地重新构建
   cd server && mvn -DskipTests package
   cd admin-web && npm run build

2. 上传产物到服务器 /opt/spend_diary/
   scp server/target/*.jar  ubuntu@<IP>:/opt/spend_diary/server.jar
   scp -r admin-web/dist/*  ubuntu@<IP>:/opt/spend_diary/dist/

3. 重跑部署脚本（幂等，会保留已有密钥和数据库密码）
   sudo bash /opt/spend_diary/deploy.sh

4. 公网验收：首页 200 + 登录接口业务码
```

### 只更新 App

```
1. 改 app/.env.production 里的地址（如果服务器变了）
2. 提升 app.json 的 versionCode（每次发版必须递增，否则无法覆盖安装）
3. npx eas-cli build -p android --profile preview --non-interactive
4. 下载后做四项校验（签名/包名/明文权限/接口地址）
```

### 上线前检查清单

- [ ] `JWT_SECRET` 不是仓库里的默认值
- [ ] 应用连库用的是专用账号，不是 root
- [ ] 新端口已在防火墙放行（不是只改了服务器本地）
- [ ] 公网侧 curl 能拿到预期业务码
- [ ] 构建产物比源码新（对一下时间戳）
- [ ] 首个管理员账号已被自己占用
- [ ] App 的接口地址与当前服务器一致

---

## 可复用的经验

1. **先查后改**：体检结果决定方案，不要照抄教程。
2. **不碰别人的服务**：端口冲突就换端口，不要停掉机器上已有的东西。
3. **密钥不入代码库**：服务器本地生成、600 权限、不进命令行。
4. **容器不是必选项**：没有 Docker 时，systemd + nginx 更轻、排错更直观。
5. **小内存要限堆**：`-Xmx448m` 这类参数不是凑数，是给 MySQL 留活路。
6. **公网视角验收**：服务器本地通 ≠ 外部能访问，防火墙是独立一层。
7. **换目录要清生成物**：`autolinking.json` / `.cxx` / `build` 这些文件会携带旧绝对路径，靠哈希缓存的工具会直接复用它们。
8. **本地环境搞不定就换环境**：Windows 长路径这类平台级限制，与其绕，不如把构建挪到 Linux（云构建或 WSL2）。
9. **证据驱动排错**：量一下真实路径长度、读 daemon 日志、看进程状态，比反复重试有效得多。本次五轮失败里有三轮其实早就失败了，只是轮询没及时发现。
