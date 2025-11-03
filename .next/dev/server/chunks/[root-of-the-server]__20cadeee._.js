module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/@prisma/client [external] (@prisma/client, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("@prisma/client", () => require("@prisma/client"));

module.exports = mod;
}),
"[project]/src/lib/prisma.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
;
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["PrismaClient"]({
    log: [
        'query',
        'error'
    ]
});
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = prisma;
}),
"[project]/src/app/api/admin/bookings/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$startOfDay$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/startOfDay.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$endOfDay$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/endOfDay.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$startOfWeek$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/startOfWeek.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$endOfWeek$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/endOfWeek.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$startOfMonth$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/startOfMonth.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$endOfMonth$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/endOfMonth.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$addDays$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/addDays.mjs [app-route] (ecmascript)");
;
;
;
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';
        const location = searchParams.get('location') || '';
        const dateRange = searchParams.get('dateRange') || '';
        const productType = searchParams.get('productType') || '';
        const skip = (page - 1) * limit;
        // Build where clause
        const whereClause = {
            AND: []
        };
        // Search filter
        if (search) {
            whereClause.AND?.push({
                OR: [
                    {
                        student: {
                            name: {
                                contains: search,
                                mode: 'insensitive'
                            }
                        }
                    },
                    {
                        product: {
                            name: {
                                contains: search,
                                mode: 'insensitive'
                            }
                        }
                    },
                    {
                        location: {
                            name: {
                                contains: search,
                                mode: 'insensitive'
                            }
                        }
                    }
                ]
            });
        }
        // Status filter
        if (status) {
            whereClause.AND?.push({
                status: status
            });
        }
        // Location filter
        if (location) {
            whereClause.AND?.push({
                locationId: location
            });
        }
        // Product type filter
        if (productType) {
            whereClause.AND?.push({
                product: {
                    type: productType
                }
            });
        }
        // Date range filter
        if (dateRange) {
            const now = new Date();
            let startDate;
            let endDate;
            switch(dateRange){
                case 'today':
                    startDate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$startOfDay$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["startOfDay"])(now);
                    endDate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$endOfDay$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["endOfDay"])(now);
                    break;
                case 'tomorrow':
                    startDate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$startOfDay$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["startOfDay"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$addDays$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["addDays"])(now, 1));
                    endDate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$endOfDay$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["endOfDay"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$addDays$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["addDays"])(now, 1));
                    break;
                case 'this_week':
                    startDate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$startOfWeek$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["startOfWeek"])(now, {
                        weekStartsOn: 1
                    });
                    endDate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$endOfWeek$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["endOfWeek"])(now, {
                        weekStartsOn: 1
                    });
                    break;
                case 'next_week':
                    startDate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$startOfWeek$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["startOfWeek"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$addDays$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["addDays"])(now, 7), {
                        weekStartsOn: 1
                    });
                    endDate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$endOfWeek$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["endOfWeek"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$addDays$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["addDays"])(now, 7), {
                        weekStartsOn: 1
                    });
                    break;
                case 'this_month':
                    startDate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$startOfMonth$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["startOfMonth"])(now);
                    endDate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$endOfMonth$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["endOfMonth"])(now);
                    break;
                case 'next_month':
                    startDate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$startOfMonth$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["startOfMonth"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$addDays$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["addDays"])(now, 30));
                    endDate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$endOfMonth$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["endOfMonth"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$addDays$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["addDays"])(now, 30));
                    break;
                default:
                    startDate = now;
                    endDate = now;
            }
            whereClause.AND?.push({
                startDate: {
                    gte: startDate,
                    lte: endDate
                }
            });
        }
        // Get total count
        const total = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].booking.count({
            where: whereClause
        });
        // Get bookings
        const bookings = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].booking.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                student: {
                    select: {
                        name: true,
                        birthdate: true
                    }
                },
                product: {
                    select: {
                        name: true,
                        type: true
                    }
                },
                location: {
                    select: {
                        name: true
                    }
                }
            }
        });
        const formattedBookings = bookings.map((booking)=>({
                id: booking.id,
                student: booking.student,
                product: booking.product,
                location: booking.location,
                startDate: booking.startDate.toISOString(),
                endDate: booking.endDate.toISOString(),
                status: booking.status,
                totalPrice: parseFloat(booking.totalPrice.toString()),
                notes: booking.notes
            }));
        const totalPages = Math.ceil(total / limit);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            bookings: formattedBookings,
            total,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        console.error('Bookings API error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to fetch bookings'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__20cadeee._.js.map