import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Segmented,
  Space,
  Table,
  Tag,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useState } from 'react'
import { createCategory, deleteCategory, listCategories, updateCategory, type CategoryInput } from '../../api'
import type { Category, CategoryType } from '../../api/types'

interface CategoryForm {
  name: string
  type: CategoryType
  icon?: string
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<CategoryForm>()

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
    void load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ type: 'EXPENSE' })
    setModalOpen(true)
  }

  const openEdit = (c: Category) => {
    setEditing(c)
    form.resetFields()
    form.setFieldsValue({ name: c.name, type: c.type, icon: c.icon })
    setModalOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    const input: CategoryInput = { name: values.name, type: values.type, icon: values.icon || '' }
    setSaving(true)
    try {
      if (editing) {
        await updateCategory(editing.id, input)
      } else {
        await createCategory(input)
      }
      setModalOpen(false)
      void load()
    } catch {
      // 错误提示由拦截器统一处理
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteCategory(id)
      void load()
    } catch {
      // 错误提示由拦截器统一处理
    }
  }

  const columns: ColumnsType<Category> = [
    { title: '图标', dataIndex: 'icon', width: 80, align: 'center' },
    {
      title: '名称',
      dataIndex: 'name',
      width: 200,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (t: CategoryType) =>
        t === 'EXPENSE' ? <Tag color="red">支出</Tag> : <Tag color="green">收入</Tag>,
    },
    {
      title: '来源',
      dataIndex: 'builtin',
      width: 100,
      render: (b: boolean) => (b ? <Tag>内置</Tag> : <Tag color="blue">自定义</Tag>),
    },
    {
      title: '操作',
      width: 110,
      render: (_, r) =>
        r.builtin ? null : (
          <Space>
            <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(r)} />
            <Popconfirm title="确定删除该分类？" onConfirm={() => handleDelete(r.id)}>
              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
    },
  ]

  return (
    <div>
      <Card
        title="分类管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增分类
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={categories}
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title={editing ? '编辑分类' : '新增分类'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="分类名称，1-16 字" maxLength={16} />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Segmented
              options={[
                { label: '支出', value: 'EXPENSE' },
                { label: '收入', value: 'INCOME' },
              ]}
            />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <Input placeholder="emoji 图标（可选），如 🐱" maxLength={16} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
