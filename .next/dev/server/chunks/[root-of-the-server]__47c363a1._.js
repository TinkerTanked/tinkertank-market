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
"[project]/src/types/booking.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BookingEventSchema",
    ()=>BookingEventSchema,
    "BookingStatus",
    ()=>BookingStatus,
    "CalendarEventSchema",
    ()=>CalendarEventSchema,
    "PaymentStatus",
    ()=>PaymentStatus,
    "RecurringEventTemplateSchema",
    ()=>RecurringEventTemplateSchema,
    "bookingToCalendarEvent",
    ()=>bookingToCalendarEvent,
    "canCancelBooking",
    ()=>canCancelBooking,
    "getBookingStatusColor",
    ()=>getBookingStatusColor,
    "getPaymentStatusColor",
    ()=>getPaymentStatusColor,
    "isBookingConfirmed",
    ()=>isBookingConfirmed,
    "isBookingPaid",
    ()=>isBookingPaid
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z>");
;
var BookingStatus = /*#__PURE__*/ function(BookingStatus) {
    BookingStatus["PENDING"] = "PENDING";
    BookingStatus["CONFIRMED"] = "CONFIRMED";
    BookingStatus["CANCELLED"] = "CANCELLED";
    BookingStatus["COMPLETED"] = "COMPLETED";
    BookingStatus["NO_SHOW"] = "NO_SHOW";
    return BookingStatus;
}({});
var PaymentStatus = /*#__PURE__*/ function(PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["PAID"] = "PAID";
    PaymentStatus["PARTIALLY_PAID"] = "PARTIALLY_PAID";
    PaymentStatus["REFUNDED"] = "REFUNDED";
    PaymentStatus["FAILED"] = "FAILED";
    return PaymentStatus;
}({});
const BookingEventSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    productId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    studentId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    locationId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    startDateTime: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.date(),
    endDateTime: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.date(),
    status: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].nativeEnum(BookingStatus),
    paymentStatus: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].nativeEnum(PaymentStatus),
    totalAmount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0),
    amountPaid: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0).default(0),
    discountsApplied: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()).default([]),
    specialRequests: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    notes: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    stripePaymentIntentId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    createdAt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.date(),
    updatedAt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.date()
}).refine((data)=>data.endDateTime > data.startDateTime, {
    message: 'End time must be after start time',
    path: [
        'endDateTime'
    ]
}).refine((data)=>data.amountPaid <= data.totalAmount, {
    message: 'Amount paid cannot exceed total amount',
    path: [
        'amountPaid'
    ]
});
const RecurringEventTemplateSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    productId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    locationId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    startTime: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    endTime: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    daysOfWeek: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0).max(6)).min(1, 'At least one day must be selected'),
    startDate: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.date(),
    endDate: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.date().optional(),
    maxOccurrences: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(1).optional(),
    isActive: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().default(true)
}).refine((data)=>!data.endDate || data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: [
        'endDate'
    ]
});
const CalendarEventSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    start: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.date(),
    end: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.date(),
    backgroundColor: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    borderColor: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    extendedProps: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        bookingId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        productType: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        studentName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        location: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        status: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].nativeEnum(BookingStatus),
        paymentStatus: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].nativeEnum(PaymentStatus),
        capacity: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().optional(),
        currentBookings: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().optional()
    })
});
const isBookingConfirmed = (booking)=>{
    return booking.status === "CONFIRMED";
};
const isBookingPaid = (booking)=>{
    return booking.paymentStatus === "PAID";
};
const getBookingStatusColor = (status)=>{
    switch(status){
        case "CONFIRMED":
            return '#10B981' // green
            ;
        case "PENDING":
            return '#F59E0B' // yellow
            ;
        case "CANCELLED":
            return '#EF4444' // red
            ;
        case "COMPLETED":
            return '#6366F1' // indigo
            ;
        case "NO_SHOW":
            return '#6B7280' // gray
            ;
        default:
            return '#6B7280';
    }
};
const getPaymentStatusColor = (status)=>{
    switch(status){
        case "PAID":
            return '#10B981' // green
            ;
        case "PARTIALLY_PAID":
            return '#F59E0B' // yellow
            ;
        case "PENDING":
            return '#F59E0B' // yellow
            ;
        case "REFUNDED":
            return '#6366F1' // indigo
            ;
        case "FAILED":
            return '#EF4444' // red
            ;
        default:
            return '#6B7280';
    }
};
const bookingToCalendarEvent = (booking, product, student, location)=>{
    return {
        id: booking.id,
        title: product?.name || 'Unknown Product',
        start: booking.startDateTime,
        end: booking.endDateTime,
        backgroundColor: getBookingStatusColor(booking.status),
        borderColor: getPaymentStatusColor(booking.paymentStatus),
        extendedProps: {
            bookingId: booking.id,
            productType: product?.type || 'UNKNOWN',
            studentName: student?.name,
            location: location?.name || 'Unknown Location',
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            capacity: product?.capacity,
            currentBookings: 1
        }
    };
};
const canCancelBooking = (booking, hoursBeforeStart = 24)=>{
    if (booking.status === "CANCELLED" || booking.status === "COMPLETED") {
        return false;
    }
    const hoursUntilStart = (booking.startDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntilStart >= hoursBeforeStart;
};
}),
"[project]/src/lib/calendar-utils.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "prismaBookingToBookingEvent",
    ()=>prismaBookingToBookingEvent,
    "prismaBookingToCalendarEvent",
    ()=>prismaBookingToCalendarEvent
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$booking$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/booking.ts [app-route] (ecmascript)");
;
function prismaBookingToBookingEvent(booking) {
    return {
        id: booking.id,
        productId: booking.productId,
        product: booking.product || undefined,
        studentId: booking.studentId,
        student: booking.student || undefined,
        locationId: booking.locationId,
        location: booking.location || undefined,
        startDateTime: booking.startDate,
        endDateTime: booking.endDate,
        status: booking.status,
        paymentStatus: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$booking$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PaymentStatus"].PENDING,
        totalAmount: Number(booking.totalPrice),
        amountPaid: 0,
        discountsApplied: [],
        specialRequests: booking.notes,
        notes: booking.notes,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
    };
}
function prismaBookingToCalendarEvent(booking) {
    const bookingEvent = prismaBookingToBookingEvent(booking);
    return {
        id: booking.id,
        title: booking.product?.name || 'Unknown Product',
        start: booking.startDate,
        end: booking.endDate,
        backgroundColor: getBookingStatusColor(booking.status),
        borderColor: '#3B82F6',
        extendedProps: {
            bookingId: booking.id,
            productType: booking.product?.type || 'UNKNOWN',
            studentName: booking.student?.name,
            location: booking.location?.name || 'Unknown Location',
            status: booking.status,
            paymentStatus: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$booking$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PaymentStatus"].PENDING,
            capacity: 20,
            currentBookings: 1
        }
    };
}
// Color mapping for booking status
function getBookingStatusColor(status) {
    switch(status){
        case 'CONFIRMED':
            return '#10B981' // green
            ;
        case 'PENDING':
            return '#F59E0B' // yellow
            ;
        case 'CANCELLED':
            return '#EF4444' // red
            ;
        case 'COMPLETED':
            return '#6366F1' // indigo
            ;
        case 'NO_SHOW':
            return '#6B7280' // gray
            ;
        default:
            return '#6B7280';
    }
}
}),
"[project]/src/app/api/calendar/events/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$calendar$2d$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/calendar-utils.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$startOfMonth$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/startOfMonth.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$endOfMonth$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/endOfMonth.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$parseISO$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/parseISO.mjs [app-route] (ecmascript)");
;
;
;
;
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const startParam = searchParams.get('start');
        const endParam = searchParams.get('end');
        const viewType = searchParams.get('view') // 'customer' | 'admin'
        ;
        const productType = searchParams.get('productType');
        const locationId = searchParams.get('locationId');
        // Default to current month if no date range provided
        const now = new Date();
        const start = startParam ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$parseISO$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseISO"])(startParam) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$startOfMonth$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["startOfMonth"])(now);
        const end = endParam ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$parseISO$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseISO"])(endParam) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$endOfMonth$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["endOfMonth"])(now);
        // Build where clause
        const whereClause = {
            startDate: {
                gte: start,
                lte: end
            }
        };
        if (productType) {
            whereClause.product = {
                type: productType.toUpperCase()
            };
        }
        if (locationId) {
            whereClause.locationId = locationId;
        }
        // Fetch bookings with related data
        const bookings = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].booking.findMany({
            where: whereClause,
            include: {
                product: true,
                student: true,
                location: true
            },
            orderBy: {
                startDate: 'asc'
            }
        });
        if (viewType === 'admin') {
            // Group bookings by product/time slot for admin view
            const eventsMap = new Map();
            bookings.forEach((booking)=>{
                const key = `${booking.productId}-${booking.startDate.getTime()}`;
                if (!eventsMap.has(key)) {
                    const calendarEvent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$calendar$2d$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prismaBookingToCalendarEvent"])(booking);
                    eventsMap.set(key, {
                        ...calendarEvent,
                        extendedProps: {
                            ...calendarEvent.extendedProps,
                            product: booking.product,
                            bookings: [
                                booking
                            ],
                            availableSpots: 20 - 1,
                            currentBookings: 1
                        }
                    });
                } else {
                    const event = eventsMap.get(key);
                    event.extendedProps.bookings.push(booking);
                    event.extendedProps.currentBookings = (event.extendedProps.currentBookings || 0) + 1;
                    event.extendedProps.availableSpots = 20 - event.extendedProps.currentBookings;
                }
            });
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                events: Array.from(eventsMap.values())
            });
        } else {
            // Customer view - show individual available slots
            const events = bookings.map((booking)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$calendar$2d$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prismaBookingToCalendarEvent"])(booking));
            // Add available time slots (this would typically come from a separate table)
            // For now, we'll generate some sample available slots
            const availableSlots = await generateAvailableSlots(start, end, productType);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                events: [
                    ...events,
                    ...availableSlots
                ]
            });
        }
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Failed to fetch calendar events'
        }, {
            status: 500
        });
    }
}
async function POST(request) {
    try {
        const data = await request.json();
        // Create new booking/event
        const booking = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].booking.create({
            data: {
                studentId: data.studentId,
                productId: data.productId,
                locationId: data.locationId,
                startDate: new Date(data.startDateTime),
                endDate: new Date(data.endDateTime),
                status: data.status || 'PENDING',
                totalPrice: data.totalAmount,
                notes: data.specialRequests || data.notes
            },
            include: {
                product: true,
                student: true,
                location: true
            }
        });
        const calendarEvent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$calendar$2d$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prismaBookingToCalendarEvent"])(booking);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            event: calendarEvent,
            booking
        });
    } catch (error) {
        console.error('Error creating calendar event:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Failed to create calendar event'
        }, {
            status: 500
        });
    }
}
// Helper function to generate available time slots
// In a real app, this would query a separate availability table
async function generateAvailableSlots(start, end, productType) {
    const slots = [];
    // Sample available slots for demonstration
    const sampleProducts = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].product.findMany({
        where: productType ? {
            type: productType.toUpperCase()
        } : {},
        take: 5
    });
    const locations = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].location.findMany();
    // Generate slots for each weekday between start and end
    const current = new Date(start);
    while(current <= end){
        const dayOfWeek = current.getDay();
        // Skip weekends for camps
        if (productType === 'CAMP' && (dayOfWeek === 0 || dayOfWeek === 6)) {
            current.setDate(current.getDate() + 1);
            continue;
        }
        // Generate morning and afternoon slots
        const timeSlots = productType === 'CAMP' ? [
            {
                start: '09:00',
                end: '15:00'
            }
        ] // Full day camps
         : [
            {
                start: '09:00',
                end: '12:00'
            },
            {
                start: '13:00',
                end: '16:00'
            }
        ] // Half day sessions
        ;
        sampleProducts.forEach((product)=>{
            timeSlots.forEach((timeSlot, index)=>{
                const slotStart = new Date(current);
                const [startHour, startMin] = timeSlot.start.split(':').map(Number);
                slotStart.setHours(startHour, startMin, 0, 0);
                const slotEnd = new Date(current);
                const [endHour, endMin] = timeSlot.end.split(':').map(Number);
                slotEnd.setHours(endHour, endMin, 0, 0);
                slots.push({
                    id: `available-${product.id}-${current.toISOString().split('T')[0]}-${index}`,
                    title: `${product.name} - Available`,
                    start: slotStart,
                    end: slotEnd,
                    backgroundColor: '#E5F3FF',
                    borderColor: '#3B82F6',
                    extendedProps: {
                        productType: product.type,
                        location: locations[0]?.name || 'Neutral Bay',
                        status: 'AVAILABLE',
                        paymentStatus: 'PENDING',
                        capacity: 20,
                        currentBookings: 0
                    }
                });
            });
        });
        current.setDate(current.getDate() + 1);
    }
    return slots;
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__47c363a1._.js.map