import { createAdminCrud } from '@/lib/admin-crud'

export const { GET, POST, PATCH, DELETE } = createAdminCrud({
    table: 'mission_fields',
    idColumn: 'id',
    order: [{ column: 'sort_order' }],
    fields: {
        country: { type: 'string', max: 50, required: true },
        region: { type: 'string', max: 100 },
        lat: { type: 'number', min: -90, max: 90, required: true },
        lng: { type: 'number', min: -180, max: 180, required: true },
        missionaries: { type: 'string', max: 200 },
        summary: { type: 'string', max: 2000 },
        image_url: { type: 'string', max: 500 },
        board_slug: { type: 'string', max: 40 },
        category: { type: 'string', max: 50 },
        sort_order: { type: 'int' },
    },
})
