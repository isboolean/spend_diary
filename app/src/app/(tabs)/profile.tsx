import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ConfirmButton from '../../components/ConfirmButton'
import MonthSwitcher from '../../components/MonthSwitcher'
import {
  createAccount,
  createCategory,
  currentNickname,
  currentRole,
  deleteAccount,
  deleteBudget,
  deleteCategory,
  getBudget,
  listAccounts,
  listCategories,
  setAuth,
  updateAccount,
  updateCategory,
  upsertBudget,
  type AccountInput,
  type CategoryInput,
} from '../../lib/api'
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPES, COLORS, money } from '../../lib/format'
import type { Account, AccountType, Budget, Category, CategoryType } from '../../lib/types'

interface MenuItem {
  key: string
  icon: string
  title: string
  onPress: () => void
}

export default function Profile() {
  const [budgetOpen, setBudgetOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  const menu: MenuItem[] = [
    { key: 'budget', icon: '💰', title: '预算设置', onPress: () => setBudgetOpen(true) },
    { key: 'categories', icon: '🏷️', title: '分类管理', onPress: () => setCategoryOpen(true) },
    { key: 'accounts', icon: '🏦', title: '账户管理', onPress: () => setAccountOpen(true) },
  ]

  const logout = async () => {
    await setAuth(null)
  }

  return (
    <SafeAreaView style={styles.wrap} edges={['top']}>
      <ScrollView>
        <View style={styles.topBar}>
          <Text style={styles.topTitle}>我的</Text>
        </View>

        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(currentNickname() || '记').slice(0, 1)}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.nickname}>{currentNickname() || '用户'}</Text>
            {currentRole() === 'ADMIN' && <Text style={styles.adminTag}>管理员</Text>}
          </View>
        </View>

        <View style={styles.menuCard}>
          {menu.map((m) => (
            <Pressable key={m.key} style={styles.menuRow} onPress={m.onPress}>
              <Text style={styles.menuIcon}>{m.icon}</Text>
              <Text style={styles.menuTitle}>{m.title}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.menuCard}>
          <View style={styles.menuRow}>
            <Text style={styles.menuIcon}>🚪</Text>
            <ConfirmButton title="退出登录" danger onConfirm={() => void logout()} style={styles.menuTitleWrap} />
          </View>
        </View>
      </ScrollView>

      <BudgetModal open={budgetOpen} onClose={() => setBudgetOpen(false)} />
      <CategoriesModal open={categoryOpen} onClose={() => setCategoryOpen(false)} />
      <AccountsModal open={accountOpen} onClose={() => setAccountOpen(false)} />
    </SafeAreaView>
  )
}

function BudgetModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'))
  const [budget, setBudget] = useState<Budget | null>(null)
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setMonth(dayjs().format('YYYY-MM'))
    setSaving(false)
    getBudget(dayjs().format('YYYY-MM'))
      .then((b) => {
        setBudget(b)
        setAmount(b.amount != null ? String(b.amount) : '')
      })
      .catch(() => undefined)
  }, [open])

  const reload = async () => {
    const b = await getBudget(month)
    setBudget(b)
    setAmount(b.amount != null ? String(b.amount) : '')
  }

  const save = async () => {
    const value = Number(amount)
    if (!amount.trim() || Number.isNaN(value) || value <= 0) {
      Alert.alert('提示', '请输入正确的预算金额')
      return
    }
    setSaving(true)
    try {
      await upsertBudget(month, Math.round(value * 100) / 100)
      await reload()
    } catch {
      // 错误提示由拦截器统一处理
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    setSaving(true)
    try {
      await deleteBudget(month)
      await reload()
    } catch {
      // 错误提示由拦截器统一处理
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>预算设置</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
          <MonthSwitcher month={month} onChange={setMonth} />
          <Text style={styles.fieldLabel}>月度预算金额</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
          {budget && budget.amount != null && (
            <Text style={styles.budgetHint}>
              本月已支出 {money(budget.spent)}
              {budget.overBudget
                ? `，已超支 ${money(Math.abs(budget.remaining ?? 0))}`
                : `，剩余 ${money(budget.remaining ?? 0)}`}
            </Text>
          )}
          <View style={styles.sheetFooter}>
            {budget && budget.amount != null && (
              <ConfirmButton title="删除预算" danger onConfirm={() => void remove()} style={styles.deleteBtn} />
            )}
            <Pressable style={[styles.saveBtn, saving && styles.disabled]} onPress={() => void save()} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>保存</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

interface CategoryForm {
  name: string
  type: CategoryType
  icon: string
}

function CategoriesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState<CategoryForm>({ name: '', type: 'EXPENSE', icon: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setCategories(await listCategories())
    } catch {
      // 错误提示由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) void load()
  }, [open, load])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', type: 'EXPENSE', icon: '' })
    setEditorOpen(true)
  }

  const openEdit = (c: Category) => {
    setEditing(c)
    setForm({ name: c.name, type: c.type, icon: c.icon })
    setEditorOpen(true)
  }

  const save = async () => {
    if (!form.name.trim()) {
      Alert.alert('提示', '请输入分类名称')
      return
    }
    const input: CategoryInput = { name: form.name.trim(), type: form.type, icon: form.icon.trim() || '' }
    setSaving(true)
    try {
      if (editing) {
        await updateCategory(editing.id, input)
      } else {
        await createCategory(input)
      }
      setEditorOpen(false)
      void load()
    } catch {
      // 错误提示由拦截器统一处理
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    try {
      await deleteCategory(id)
      void load()
    } catch {
      // 错误提示由拦截器统一处理
    }
  }

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>分类管理</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.sheetScroll}>
            {categories.map((c) => (
              <View key={c.id} style={styles.itemRow}>
                <Text style={styles.itemIcon}>{c.icon}</Text>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{c.name}</Text>
                  <Text style={styles.itemMeta}>
                    {c.type === 'EXPENSE' ? '支出' : '收入'} · {c.builtin ? '内置' : '自定义'}
                  </Text>
                </View>
                {!c.builtin && (
                  <View style={styles.itemActions}>
                    <Pressable onPress={() => openEdit(c)} hitSlop={6}>
                      <Text style={styles.actionText}>编辑</Text>
                    </Pressable>
                    <ConfirmButton title="删除" danger onConfirm={() => void remove(c.id)} />
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
          <Pressable style={[styles.saveBtn, { marginTop: 12 }]} onPress={openCreate}>
            <Text style={styles.saveBtnText}>＋ 新增分类</Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={editorOpen} transparent animationType="none" onRequestClose={() => setEditorOpen(false)}>
        <View style={styles.centerOverlay}>
          <View style={styles.centerSheet}>
            <Text style={styles.sheetTitle}>{editing ? '编辑分类' : '新增分类'}</Text>
            <Text style={styles.fieldLabel}>名称</Text>
            <TextInput
              style={styles.input}
              placeholder="分类名称，1-16 字"
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              maxLength={16}
            />
            <Text style={styles.fieldLabel}>类型</Text>
            <View style={styles.typeChips}>
              {(['EXPENSE', 'INCOME'] as CategoryType[]).map((t) => (
                <Pressable
                  key={t}
                  style={[styles.chip, form.type === t && styles.chipActive]}
                  onPress={() => setForm((f) => ({ ...f, type: t }))}
                >
                  <Text style={[styles.chipText, form.type === t && styles.chipTextActive]}>
                    {t === 'EXPENSE' ? '支出' : '收入'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.fieldLabel}>图标</Text>
            <TextInput
              style={styles.input}
              placeholder="emoji 图标（可选），如 🐱"
              value={form.icon}
              onChangeText={(v) => setForm((f) => ({ ...f, icon: v }))}
              maxLength={16}
            />
            <View style={styles.sheetFooter}>
              <Pressable style={styles.cancelBtn} onPress={() => setEditorOpen(false)}>
                <Text style={styles.cancelBtnText}>取消</Text>
              </Pressable>
              <Pressable style={[styles.saveBtn, saving && styles.disabled]} onPress={() => void save()} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>保存</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  )
}

interface AccountForm {
  name: string
  type: AccountType
  initialBalance: string
}

function AccountsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [form, setForm] = useState<AccountForm>({ name: '', type: 'CASH', initialBalance: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setAccounts(await listAccounts())
    } catch {
      // 错误提示由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) void load()
  }, [open, load])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', type: 'CASH', initialBalance: '' })
    setEditorOpen(true)
  }

  const openEdit = (a: Account) => {
    setEditing(a)
    setForm({ name: a.name, type: a.type, initialBalance: String(a.balance) })
    setEditorOpen(true)
  }

  const save = async () => {
    if (!form.name.trim()) {
      Alert.alert('提示', '请输入账户名称')
      return
    }
    const value = form.initialBalance.trim() ? Number(form.initialBalance) : 0
    if (Number.isNaN(value)) {
      Alert.alert('提示', '请输入正确的余额')
      return
    }
    const input: AccountInput = { name: form.name.trim(), type: form.type, initialBalance: value }
    setSaving(true)
    try {
      if (editing) {
        await updateAccount(editing.id, input)
      } else {
        await createAccount(input)
      }
      setEditorOpen(false)
      void load()
    } catch {
      // 错误提示由拦截器统一处理
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    try {
      await deleteAccount(id)
      void load()
    } catch {
      // 错误提示由拦截器统一处理
    }
  }

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>账户管理</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.sheetScroll}>
            {loading ? (
              <ActivityIndicator style={styles.loading} />
            ) : (
              accounts.map((a) => (
                <View key={a.id} style={styles.itemRow}>
                  <Text style={styles.itemIcon}>💳</Text>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{a.name}</Text>
                    <Text style={styles.itemMeta}>
                      {ACCOUNT_TYPE_LABELS[a.type]} · 余额 {money(a.balance)}
                    </Text>
                  </View>
                  <View style={styles.itemActions}>
                    <Pressable onPress={() => openEdit(a)} hitSlop={6}>
                      <Text style={styles.actionText}>编辑</Text>
                    </Pressable>
                    <ConfirmButton title="删除" danger onConfirm={() => void remove(a.id)} />
                  </View>
                </View>
              ))
            )}
          </ScrollView>
          <Pressable style={[styles.saveBtn, { marginTop: 12 }]} onPress={openCreate}>
            <Text style={styles.saveBtnText}>＋ 新增账户</Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={editorOpen} transparent animationType="none" onRequestClose={() => setEditorOpen(false)}>
        <View style={styles.centerOverlay}>
          <View style={styles.centerSheet}>
            <Text style={styles.sheetTitle}>{editing ? '编辑账户' : '新增账户'}</Text>
            <Text style={styles.fieldLabel}>名称</Text>
            <TextInput
              style={styles.input}
              placeholder="账户名称，如 工资卡"
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              maxLength={16}
            />
            <Text style={styles.fieldLabel}>类型</Text>
            <View style={styles.pickChips}>
              {ACCOUNT_TYPES.map((t) => (
                <Pressable
                  key={t}
                  style={[styles.chip, form.type === t && styles.chipActive]}
                  onPress={() => setForm((f) => ({ ...f, type: t }))}
                >
                  <Text style={[styles.chipText, form.type === t && styles.chipTextActive]}>
                    {ACCOUNT_TYPE_LABELS[t]}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.fieldLabel}>{editing ? '当前余额' : '初始余额'}</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={form.initialBalance}
              onChangeText={(v) => setForm((f) => ({ ...f, initialBalance: v }))}
              keyboardType="decimal-pad"
            />
            <View style={styles.sheetFooter}>
              <Pressable style={styles.cancelBtn} onPress={() => setEditorOpen(false)}>
                <Text style={styles.cancelBtnText}>取消</Text>
              </Pressable>
              <Pressable style={[styles.saveBtn, saving && styles.disabled]} onPress={() => void save()} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>保存</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    padding: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nickname: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  adminTag: {
    fontSize: 11,
    color: '#d48806',
    backgroundColor: '#fffbe6',
    borderWidth: 1,
    borderColor: '#ffe58f',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 12,
    marginTop: 12,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  menuIcon: {
    fontSize: 18,
  },
  menuTitle: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  menuTitleWrap: {
    flex: 1,
  },
  menuArrow: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
    maxHeight: '85%',
  },
  sheetScroll: {
    marginTop: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  closeText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  fieldLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 15,
  },
  budgetHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  sheetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  deleteBtn: {
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 8,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    color: COLORS.text,
  },
  centerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  centerSheet: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxWidth: 420,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  itemIcon: {
    fontSize: 20,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: COLORS.text,
  },
  itemMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionText: {
    fontSize: 14,
    color: COLORS.primary,
  },
  typeChips: {
    flexDirection: 'row',
    gap: 8,
  },
  pickChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d9d9d9',
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.text,
  },
  chipTextActive: {
    color: '#fff',
  },
  loading: {
    marginVertical: 24,
  },
})
