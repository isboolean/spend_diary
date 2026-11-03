import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import dayjs from 'dayjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  createTransaction,
  deleteTransaction,
  listAccounts,
  listCategories,
  listTransactions,
  updateTransaction,
  type TransactionInput,
} from '../../lib/api'
import { COLORS, formatTime, nowString, signedMoney, toLocalDateTime } from '../../lib/format'
import type { Account, Category, Transaction, TransactionType } from '../../lib/types'

const TYPE_FILTERS: { value: 'ALL' | TransactionType; label: string }[] = [
  { value: 'ALL', label: '全部' },
  { value: 'EXPENSE', label: '支出' },
  { value: 'INCOME', label: '收入' },
]

interface TxForm {
  amount: string
  type: TransactionType
  accountId: number
  categoryId: number
  occurredAt: string
  note: string
}

const emptyForm = (accounts: Account[], categories: Category[]): TxForm => ({
  amount: '',
  type: 'EXPENSE',
  accountId: accounts[0]?.id ?? 0,
  categoryId: categories.find((c) => c.type === 'EXPENSE')?.id ?? 0,
  occurredAt: nowString(),
  note: '',
})

export default function Transactions() {
  const router = useRouter()
  const params = useLocalSearchParams<{ new?: string; edit?: string }>()
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'))
  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL')
  const [keyword, setKeyword] = useState('')
  const [list, setList] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

  const [editorVisible, setEditorVisible] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [form, setForm] = useState<TxForm>(() => emptyForm([], []))
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const query = { month, ...(typeFilter !== 'ALL' ? { type: typeFilter } : {}), ...(keyword.trim() ? { keyword: keyword.trim() } : {}) }
      setList(await listTransactions(query))
    } catch {
      // 错误提示由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }, [month, typeFilter, keyword])

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load]),
  )

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => void load(), 300)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [keyword, load])

  const openCreate = useCallback(async () => {
    try {
      const [a, c] = await Promise.all([listAccounts(), listCategories()])
      setAccounts(a)
      setCategories(c)
      setEditing(null)
      setForm(emptyForm(a, c))
      setEditorVisible(true)
    } catch {
      // 错误提示由拦截器统一处理
    }
  }, [])

  const openEdit = useCallback(
    async (tx: Transaction) => {
      try {
        const [a, c] = await Promise.all([listAccounts(), listCategories()])
        setAccounts(a)
        setCategories(c)
        setEditing(tx)
        setForm({
          amount: String(tx.amount),
          type: tx.type,
          accountId: tx.accountId,
          categoryId: tx.categoryId,
          occurredAt: dayjs(tx.occurredAt).format('YYYY-MM-DD HH:mm'),
          note: tx.note ?? '',
        })
        setEditorVisible(true)
      } catch {
        // 错误提示由拦截器统一处理
      }
    },
    [],
  )

  useEffect(() => {
    if (params.new === '1') {
      router.setParams({ new: '' })
      void openCreate()
    } else if (params.edit) {
      const id = Number(params.edit)
      const tx = list.find((t) => t.id === id)
      router.setParams({ edit: '' })
      if (tx) void openEdit(tx)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.new, params.edit])

  const switchType = (t: TransactionType) => {
    setForm((f) => ({
      ...f,
      type: t,
      categoryId: categories.find((c) => c.type === t)?.id ?? 0,
    }))
  }

  const save = async () => {
    const amountNum = Number(form.amount)
    if (!form.amount.trim() || Number.isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('提示', '请输入正确的金额')
      return
    }
    if (!form.accountId) {
      Alert.alert('提示', '请先选择账户（可在「我的」中新增）')
      return
    }
    if (!form.categoryId) {
      Alert.alert('提示', '请选择分类')
      return
    }
    const input: TransactionInput = {
      accountId: form.accountId,
      categoryId: form.categoryId,
      type: form.type,
      amount: Math.round(amountNum * 100) / 100,
      occurredAt: toLocalDateTime(form.occurredAt),
      note: form.note.trim() || null,
    }
    setSaving(true)
    try {
      if (editing) {
        await updateTransaction(editing.id, input)
      } else {
        await createTransaction(input)
      }
      setEditorVisible(false)
      void load()
    } catch {
      // 错误提示由拦截器统一处理
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await deleteTransaction(editing.id)
      setEditorVisible(false)
      void load()
    } catch {
      // 错误提示由拦截器统一处理
    } finally {
      setSaving(false)
    }
  }

  const visibleCategories = categories.filter((c) => c.type === form.type)

  return (
    <SafeAreaView style={styles.wrap} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>账单</Text>
        <MonthSwitcher month={month} onChange={setMonth} />
        <Pressable style={styles.fab} onPress={() => void openCreate()}>
          <Text style={styles.fabText}>＋</Text>
        </Pressable>
      </View>

      <View style={styles.filters}>
        <View style={styles.typeChips}>
          {TYPE_FILTERS.map((f) => (
            <Pressable
              key={f.value}
              style={[styles.chip, typeFilter === f.value && styles.chipActive]}
              onPress={() => setTypeFilter(f.value)}
            >
              <Text style={[styles.chipText, typeFilter === f.value && styles.chipTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          style={styles.search}
          placeholder="搜索备注 / 分类"
          value={keyword}
          onChangeText={setKeyword}
          returnKeyType="search"
        />
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => String(item.id)}
        refreshing={loading && list.length > 0}
        onRefresh={() => void load()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable style={styles.txRow} onPress={() => void openEdit(item)}>
            <Text style={styles.txIcon}>{item.categoryIcon}</Text>
            <View style={styles.txInfo}>
              <Text style={styles.txName}>{item.categoryName}</Text>
              <Text style={styles.txMeta} numberOfLines={1}>
                {item.accountName} · {formatTime(item.occurredAt)}
                {item.note ? ` · ${item.note}` : ''}
              </Text>
            </View>
            <Text
              style={[styles.txAmount, { color: item.type === 'EXPENSE' ? COLORS.expense : COLORS.income }]}
            >
              {signedMoney(item.amount, item.type)}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loading} />
          ) : (
            <Text style={styles.emptyText}>暂无账单，点击右上角 ＋ 记一笔</Text>
          )
        }
      />

      <Modal visible={editorVisible} transparent animationType="none" onRequestClose={() => setEditorVisible(false)}>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{editing ? '编辑账单' : '记一笔'}</Text>
              <Pressable onPress={() => setEditorVisible(false)} hitSlop={8}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>金额</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={form.amount}
                onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
                keyboardType="decimal-pad"
                autoFocus={!editing}
              />

              <Text style={styles.fieldLabel}>类型</Text>
              <View style={styles.typeChips}>
                {(['EXPENSE', 'INCOME'] as TransactionType[]).map((t) => (
                  <Pressable
                    key={t}
                    style={[styles.chip, form.type === t && styles.chipActive]}
                    onPress={() => switchType(t)}
                  >
                    <Text style={[styles.chipText, form.type === t && styles.chipTextActive]}>
                      {t === 'EXPENSE' ? '支出' : '收入'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>账户</Text>
              <View style={styles.pickChips}>
                {accounts.map((a) => (
                  <Pressable
                    key={a.id}
                    style={[styles.chip, form.accountId === a.id && styles.chipActive]}
                    onPress={() => setForm((f) => ({ ...f, accountId: a.id }))}
                  >
                    <Text style={[styles.chipText, form.accountId === a.id && styles.chipTextActive]}>
                      {a.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>分类</Text>
              <View style={styles.pickChips}>
                {visibleCategories.map((c) => (
                  <Pressable
                    key={c.id}
                    style={[styles.chip, form.categoryId === c.id && styles.chipActive]}
                    onPress={() => setForm((f) => ({ ...f, categoryId: c.id }))}
                  >
                    <Text style={[styles.chipText, form.categoryId === c.id && styles.chipTextActive]}>
                      {c.icon} {c.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>时间</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD HH:mm"
                value={form.occurredAt}
                onChangeText={(v) => setForm((f) => ({ ...f, occurredAt: v }))}
                autoCapitalize="none"
              />

              <Text style={styles.fieldLabel}>备注（可选）</Text>
              <TextInput
                style={styles.input}
                placeholder="备注"
                value={form.note}
                onChangeText={(v) => setForm((f) => ({ ...f, note: v }))}
              />
            </ScrollView>
            <View style={styles.sheetFooter}>
              {editing && (
                <ConfirmButton title="删除" danger onConfirm={() => void remove()} style={styles.deleteBtn} />
              )}
              <Pressable
                style={[styles.saveBtn, saving && styles.disabled]}
                onPress={() => void save()}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>保存</Text>}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    width: 56,
  },
  fab: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 20,
  },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typeChips: {
    flexDirection: 'row',
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
  search: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 34,
    fontSize: 13,
    backgroundColor: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    gap: 10,
  },
  txIcon: {
    fontSize: 22,
  },
  txInfo: {
    flex: 1,
  },
  txName: {
    fontSize: 14,
    color: COLORS.text,
  },
  txMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  loading: {
    marginTop: 24,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 32,
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
    paddingBottom: 16,
    maxHeight: '85%',
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
  },
  closeText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  fieldLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 10,
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
  pickChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sheetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
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
    fontSize: 16,
    fontWeight: '600',
  },
})
