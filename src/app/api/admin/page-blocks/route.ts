import { createAdminCrud } from '@/lib/admin-crud'

export const { GET, POST, PATCH, DELETE } = createAdminCrud({
    table: 'page_blocks',
    idColumn: 'key',
    order: [{ column: 'key' }],
    fields: {
        title: { type: 'string', max: 200 },
        subtitle: { type: 'string', max: 300 },
        body: { type: 'string', max: 20000 },
        image_url: { type: 'string', max: 500 },
    },
})
