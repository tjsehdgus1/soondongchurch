import { createAdminCrud } from '@/lib/admin-crud'

export const { GET, POST, PATCH, DELETE } = createAdminCrud({
    table: 'timeline_items',
    idColumn: 'id',
    order: [{ column: 'year' }, { column: 'sort_order' }],
    fields: {
        year: { type: 'int', required: true },
        date_label: { type: 'string', max: 40 },
        title: { type: 'string', max: 1000, required: true },
        description: { type: 'string', max: 3000 },
        image_url: { type: 'string', max: 500 },
        sort_order: { type: 'int' },
    },
})
