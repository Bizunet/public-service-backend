import swaggerUi from 'swagger-ui-express';
const swaggerSpec = {
    openapi: '3.0.0',
    info: {
        title: 'Helix Business API',
        version: '1.0.0',
        description: 'API documentation for the employee portal, reports, announcements, hero slides, and contact flows.',
    },
    servers: [
        {
            url: 'http://localhost:3000',
            description: 'Local development server',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
        schemas: {
            ErrorResponse: {
                type: 'object',
                properties: {
                    message: {
                        type: 'string',
                        example: 'Authentication is required',
                    },
                },
            },
            User: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 12 },
                    name: { type: 'string', example: 'Aster Bekele' },
                    email: { type: 'string', example: 'aster.bekele@helix.com' },
                    employeeId: { type: 'string', example: 'EMP-1042' },
                    role: { type: 'string', example: 'USER' },
                },
            },
            Announcement: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 5 },
                    title: { type: 'string', example: 'Quarterly town hall' },
                    body: { type: 'string', example: 'Please join our quarterly briefing tomorrow at 9:00 AM.' },
                    published: { type: 'boolean', example: true },
                    authorId: { type: 'integer', example: 12 },
                    createdAt: { type: 'string', format: 'date-time', example: '2026-08-30T06:20:00.000Z' },
                    updatedAt: { type: 'string', format: 'date-time', example: '2026-08-30T06:20:00.000Z' },
                },
            },
            Slide: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 3 },
                    imagePath: { type: 'string', example: 'slides/1a2b3c.png' },
                    captionEn: { type: 'string', nullable: true, example: 'Welcome to Helix' },
                    captionAm: { type: 'string', nullable: true, example: 'እንኳን ደህና መጡ' },
                    linkTo: { type: 'string', nullable: true, example: '/reports' },
                    order: { type: 'integer', example: 1 },
                    isActive: { type: 'boolean', example: true },
                    imageUrl: { type: 'string', example: 'https://cdn.example.com/slides/1a2b3c.png' },
                },
            },
            ContactMessage: {
                type: 'object',
                properties: {
                    reference: { type: 'string', example: 'HZ-MSG-2026-35491' },
                },
            },
            ReportSubmissionResponse: {
                type: 'object',
                properties: {
                    reference: { type: 'string', example: 'HZ-RPT-2026-10482' },
                },
            },
        },
    },
    paths: {
        '/': {
            get: {
                summary: 'Health check',
                tags: ['System'],
                responses: {
                    200: {
                        description: 'Service is running',
                        content: {
                            'text/plain': {
                                example: 'Hello World!',
                            },
                        },
                    },
                },
            },
        },
        '/api/auth/signup': {
            post: {
                summary: 'Create a new user account',
                tags: ['Auth'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            example: {
                                fullName: 'Aster Bekele',
                                email: 'aster.bekele@helix.com',
                                employeeId: 'EMP-1042',
                                password: 'Welcome123!',
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'User created successfully',
                        content: {
                            'application/json': {
                                example: {
                                    user: {
                                        id: 12,
                                        name: 'Aster Bekele',
                                        email: 'aster.bekele@helix.com',
                                        employeeId: 'EMP-1042',
                                        role: 'USER',
                                    },
                                    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyLCJpYXQiOjE3MjQ...'
                                },
                            },
                        },
                    },
                    400: {
                        description: 'Missing required input fields',
                        content: {
                            'application/json': {
                                example: { message: 'All fields are required' },
                            },
                        },
                    },
                    409: {
                        description: 'Email or employee ID already exists',
                        content: {
                            'application/json': {
                                example: { message: 'Email or employee ID is already registered' },
                            },
                        },
                    },
                },
            },
        },
        '/api/auth/login': {
            post: {
                summary: 'Authenticate an employee',
                tags: ['Auth'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            example: {
                                employeeId: 'EMP-1042',
                                password: 'Welcome123!',
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Login successful',
                        content: {
                            'application/json': {
                                example: {
                                    user: {
                                        id: 12,
                                        name: 'Aster Bekele',
                                        email: 'aster.bekele@helix.com',
                                        employeeId: 'EMP-1042',
                                        role: 'USER',
                                    },
                                    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyLCJpYXQiOjE3MjQ...'
                                },
                            },
                        },
                    },
                    401: {
                        description: 'Invalid credentials',
                        content: {
                            'application/json': {
                                example: { message: 'Invalid credentials' },
                            },
                        },
                    },
                },
            },
        },
        '/api/contact': {
            post: {
                summary: 'Send a contact message',
                tags: ['Contact'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            example: {
                                name: 'Selam Taye',
                                email: 'selam.taye@example.com',
                                subject: 'Need support with onboarding',
                                message: 'I would like to know which documents are required for the new employee onboarding process.',
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Contact message is sent',
                        content: {
                            'application/json': {
                                example: {
                                    reference: 'HZ-MSG-2026-35491',
                                },
                            },
                        },
                    },
                    400: {
                        description: 'Validation failed',
                        content: {
                            'application/json': {
                                example: { message: 'Name, email, subject, and message are required' },
                            },
                        },
                    },
                },
            },
        },
        '/api/reports': {
            post: {
                summary: 'Submit a report with attachments',
                tags: ['Reports'],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                required: ['reportType', 'fullName', 'empId', 'office', 'position', 'periodStart', 'periodEnd', 'files'],
                                properties: {
                                    reportType: {
                                        type: 'string',
                                        enum: ['weekly', 'monthly', 'custom'],
                                        example: 'monthly',
                                    },
                                    fullName: { type: 'string', example: 'Aster Bekele' },
                                    empId: { type: 'string', example: 'EMP-1042' },
                                    office: { type: 'string', example: 'Head Office' },
                                    position: { type: 'string', example: 'Operations Analyst' },
                                    periodStart: { type: 'string', format: 'date', example: '2026-08-01' },
                                    periodEnd: { type: 'string', format: 'date', example: '2026-08-31' },
                                    notes: { type: 'string', example: 'Attached monthly performance summary and client follow-up notes.' },
                                    files: {
                                        type: 'array',
                                        items: { type: 'string', format: 'binary' },
                                        description: 'Upload one or more PDF, image, or Word files.',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Report submitted and files uploaded',
                        content: {
                            'application/json': {
                                example: {
                                    reference: 'HZ-RPT-2026-10482',
                                },
                            },
                        },
                    },
                    400: {
                        description: 'Incomplete or invalid data',
                        content: {
                            'application/json': {
                                example: { message: 'Complete report details and at least one PDF, image, or Word document are required' },
                            },
                        },
                    },
                    401: {
                        description: 'Missing or invalid token',
                        content: {
                            'application/json': {
                                example: { message: 'Authentication is required' },
                            },
                        },
                    },
                },
            },
        },
        '/api/administrators': {
            get: {
                summary: 'List public administrator profiles',
                tags: ['Administrators'],
                responses: {
                    200: {
                        description: 'List of administrators',
                        content: {
                            'application/json': {
                                example: [
                                    {
                                        id: 1,
                                        key: 'sara-mengistu',
                                        nameAm: 'ሳራ መንግስቱ',
                                        nameEn: 'Sara Mengistu',
                                        roleAm: 'የስራ አስኪያጅ',
                                        roleEn: 'Operations Manager',
                                        badgeAm: 'ሰበብ',
                                        badgeEn: 'Operations',
                                        team: 'Leadership',
                                        imagePath: 'administrators/sara-mengistu/uuid.png',
                                        phone: '+251911223344',
                                        email: 'sara.mengistu@helix.com',
                                        isLeader: true,
                                        photo: 'https://cdn.example.com/administrators/sara-mengistu/uuid.png',
                                        createdAt: '2026-08-30T06:20:00.000Z',
                                        updatedAt: '2026-08-30T06:20:00.000Z',
                                    },
                                ],
                            },
                        },
                    },
                },
            },
        },
        '/api/administrators/{id}': {
            put: {
                summary: 'Update an administrator profile',
                tags: ['Administrators'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: { type: 'integer' },
                        example: 1,
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    nameAm: { type: 'string', example: 'ሳራ መንግስቱ' },
                                    nameEn: { type: 'string', example: 'Sara Mengistu' },
                                    roleAm: { type: 'string', example: 'የስራ አስኪያጅ' },
                                    roleEn: { type: 'string', example: 'Operations Manager' },
                                    badgeAm: { type: 'string', nullable: true, example: 'ሰበብ' },
                                    badgeEn: { type: 'string', nullable: true, example: 'Operations' },
                                    team: { type: 'string', nullable: true, example: 'Leadership' },
                                    phone: { type: 'string', nullable: true, example: '+251911223344' },
                                    email: { type: 'string', nullable: true, example: 'sara.mengistu@helix.com' },
                                    image: { type: 'string', format: 'binary' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Administrator updated successfully',
                        content: {
                            'application/json': {
                                example: {
                                    id: 1,
                                    key: 'sara-mengistu',
                                    nameAm: 'ሳራ መንግስቱ',
                                    nameEn: 'Sara Mengistu',
                                    roleAm: 'የስራ አስኪያጅ',
                                    roleEn: 'Operations Manager',
                                    badgeAm: 'ሰበብ',
                                    badgeEn: 'Operations',
                                    team: 'Leadership',
                                    imagePath: 'administrators/sara-mengistu/uuid.png',
                                    phone: '+251911223344',
                                    email: 'sara.mengistu@helix.com',
                                    isLeader: true,
                                    photo: 'https://cdn.example.com/administrators/sara-mengistu/uuid.png',
                                },
                            },
                        },
                    },
                    404: {
                        description: 'Administrator not found',
                        content: {
                            'application/json': {
                                example: { message: 'Administrator not found' },
                            },
                        },
                    },
                },
            },
        },
        '/api/announcements': {
            get: {
                summary: 'Get published announcements',
                tags: ['Announcements'],
                responses: {
                    200: {
                        description: 'Published announcements list',
                        content: {
                            'application/json': {
                                example: [
                                    {
                                        id: 5,
                                        title: 'Quarterly town hall',
                                        body: 'Please join our quarterly briefing tomorrow at 9:00 AM.',
                                        published: true,
                                        authorId: 12,
                                        createdAt: '2026-08-30T06:20:00.000Z',
                                        updatedAt: '2026-08-30T06:20:00.000Z',
                                    },
                                ],
                            },
                        },
                    },
                },
            },
            post: {
                summary: 'Create a new announcement',
                tags: ['Announcements'],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            example: {
                                title: 'Quarterly town hall',
                                body: 'Please join our quarterly briefing tomorrow at 9:00 AM.',
                                published: true,
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Announcement created',
                        content: {
                            'application/json': {
                                example: {
                                    id: 5,
                                    title: 'Quarterly town hall',
                                    body: 'Please join our quarterly briefing tomorrow at 9:00 AM.',
                                    published: true,
                                    authorId: 12,
                                    createdAt: '2026-08-30T06:20:00.000Z',
                                    updatedAt: '2026-08-30T06:20:00.000Z',
                                },
                            },
                        },
                    },
                    400: {
                        description: 'Title and body are required',
                        content: {
                            'application/json': {
                                example: { message: 'Title and body are required' },
                            },
                        },
                    },
                },
            },
        },
        '/api/announcements/{id}': {
            put: {
                summary: 'Update an announcement',
                tags: ['Announcements'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: { type: 'integer' },
                        example: 5,
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            example: {
                                title: 'Quarterly town hall updated',
                                body: 'Updated agenda: leadership updates, Q&A session, and recognition ceremony.',
                                published: true,
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Announcement updated',
                        content: {
                            'application/json': {
                                example: {
                                    id: 5,
                                    title: 'Quarterly town hall updated',
                                    body: 'Updated agenda: leadership updates, Q&A session, and recognition ceremony.',
                                    published: true,
                                    authorId: 12,
                                    createdAt: '2026-08-30T06:20:00.000Z',
                                    updatedAt: '2026-08-30T06:21:00.000Z',
                                },
                            },
                        },
                    },
                    404: {
                        description: 'Announcement not found',
                        content: {
                            'application/json': {
                                example: { message: 'Announcement not found' },
                            },
                        },
                    },
                },
            },
            delete: {
                summary: 'Delete an announcement',
                tags: ['Announcements'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: { type: 'integer' },
                        example: 5,
                    },
                ],
                responses: {
                    204: {
                        description: 'Announcement deleted successfully',
                    },
                    404: {
                        description: 'Announcement not found',
                        content: {
                            'application/json': {
                                example: { message: 'Announcement not found' },
                            },
                        },
                    },
                },
            },
        },
        '/api/stats/public': {
            get: {
                summary: 'Get public statistics',
                tags: ['Statistics'],
                responses: {
                    200: {
                        description: 'Public dashboard statistics',
                        content: {
                            'application/json': {
                                example: {
                                    totalEmployees: 188,
                                    totalReports: 42,
                                },
                            },
                        },
                    },
                },
            },
        },
        '/api/stats/admin': {
            get: {
                summary: 'Get administrator dashboard statistics',
                tags: ['Statistics'],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Admin overview metrics',
                        content: {
                            'application/json': {
                                example: {
                                    totalReports: 42,
                                    totalEmployees: 188,
                                    totalContactMessages: 11,
                                    totalAnnouncements: 5,
                                    reportsLast30Days: 14,
                                    reportsByType: [
                                        { reportType: 'weekly', count: 18 },
                                        { reportType: 'monthly', count: 18 },
                                        { reportType: 'custom', count: 6 },
                                    ],
                                    reportsByOffice: [
                                        { office: 'Head Office', count: 21 },
                                        { office: 'Field Office', count: 11 },
                                        { office: 'Support Office', count: 10 },
                                    ],
                                    recentReports: [
                                        {
                                            reference: 'HZ-RPT-2026-10482',
                                            fullName: 'Aster Bekele',
                                            office: 'Head Office',
                                            createdAt: '2026-08-30T06:18:00.000Z',
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
            },
        },
        '/api/slides': {
            get: {
                summary: 'List active hero slides',
                tags: ['Slides'],
                responses: {
                    200: {
                        description: 'Active slides',
                        content: {
                            'application/json': {
                                example: [
                                    {
                                        id: 1,
                                        imagePath: 'slides/slider-1.png',
                                        captionEn: 'Welcome to Helix',
                                        captionAm: 'እንኳን ደህና መጡ',
                                        linkTo: '/reports',
                                        order: 1,
                                        isActive: true,
                                        imageUrl: 'https://cdn.example.com/slides/slider-1.png',
                                    },
                                ],
                            },
                        },
                    },
                },
            },
            post: {
                summary: 'Create a hero slide',
                tags: ['Slides'],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                required: ['image'],
                                properties: {
                                    image: { type: 'string', format: 'binary' },
                                    captionEn: { type: 'string', example: 'Welcome to Helix' },
                                    captionAm: { type: 'string', example: 'እንኳን ደህና መጡ' },
                                    linkTo: { type: 'string', example: '/reports' },
                                    order: { type: 'integer', example: 1 },
                                    isActive: { type: 'boolean', example: true },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Slide created',
                        content: {
                            'application/json': {
                                example: {
                                    id: 1,
                                    imagePath: 'slides/slider-1.png',
                                    captionEn: 'Welcome to Helix',
                                    captionAm: 'እንኳን ደህና መጡ',
                                    linkTo: '/reports',
                                    order: 1,
                                    isActive: true,
                                    imageUrl: 'https://cdn.example.com/slides/slider-1.png',
                                },
                            },
                        },
                    },
                    400: {
                        description: 'Image or validation issues',
                        content: {
                            'application/json': {
                                example: { message: 'An image is required' },
                            },
                        },
                    },
                },
            },
        },
        '/api/slides/{id}': {
            put: {
                summary: 'Update a hero slide',
                tags: ['Slides'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: { type: 'integer' },
                        example: 1,
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    image: { type: 'string', format: 'binary' },
                                    captionEn: { type: 'string', example: 'Welcome to Helix' },
                                    captionAm: { type: 'string', example: 'እንኳን ደህና መጡ' },
                                    linkTo: { type: 'string', example: '/reports' },
                                    order: { type: 'integer', example: 2 },
                                    isActive: { type: 'boolean', example: true },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Slide updated',
                        content: {
                            'application/json': {
                                example: {
                                    id: 1,
                                    imagePath: 'slides/slider-1-updated.png',
                                    captionEn: 'Welcome to Helix',
                                    captionAm: 'እንኳን ደህና መጡ',
                                    linkTo: '/reports',
                                    order: 2,
                                    isActive: true,
                                    imageUrl: 'https://cdn.example.com/slides/slider-1-updated.png',
                                },
                            },
                        },
                    },
                    404: {
                        description: 'Slide not found',
                        content: {
                            'application/json': {
                                example: { message: 'Slide not found' },
                            },
                        },
                    },
                },
            },
            delete: {
                summary: 'Delete a hero slide',
                tags: ['Slides'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: { type: 'integer' },
                        example: 1,
                    },
                ],
                responses: {
                    204: {
                        description: 'Slide deleted successfully',
                    },
                    404: {
                        description: 'Slide not found',
                        content: {
                            'application/json': {
                                example: { message: 'Slide not found' },
                            },
                        },
                    },
                },
            },
        },
    },
};
export function setupSwagger(app) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customSiteTitle: 'Helix Business API Docs',
    }));
    app.get('/api-docs.json', (_req, res) => {
        res.json(swaggerSpec);
    });
}
