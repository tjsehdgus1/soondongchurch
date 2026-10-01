import { createAdminCrud } from '@/lib/admin-crud'

export const { GET, POST, PATCH, DELETE } = createAdminCrud({
    table: 'people',
    idColumn: 'id',
    order: [{ column: 'sort_order' }],
    fields: {
        category: { type: 'string', max: 50, required: true },
        name: { type: 'string', max: 50, required: true },
        role: { type: 'string', max: 50 },
        period: { type: 'string', max: 100 },
        photo_url: { type: 'string', max: 500 },
        members_only: { type: 'boolean' },
        sort_order: { type: 'int' },
    },
})
