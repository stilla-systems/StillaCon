export type EntityId = string
export type ISODateString = string
export type UserRole = "CUSTOMER" | "ADMIN" | "SUPER_ADMIN" | "NETWORK_ADMIN"
export type EntityStatus = "ACTIVE" | "EXPIRED" | "SUSPENDED" | "PENDING" | "SUCCESS" | "FAILED" | "AUTHORIZED" | "BLOCKED" | "ONLINE" | "DEGRADED" | "OFFLINE"

export interface BaseEntity { id: EntityId; createdAt: ISODateString; updatedAt: ISODateString }
export interface Customer extends BaseEntity { name: string; email: string; phone: string; authUserId?: EntityId; role: "CUSTOMER" }
export interface Admin extends BaseEntity { name: string; email: string; authUserId?: EntityId; role: Exclude<UserRole, "CUSTOMER">; active: boolean }
export interface Plan extends BaseEntity { name: string; priceMinor: number; currency: "GHS"; speedMbps: number; durationDays: number; description: string; active: boolean }
export interface Subscription extends BaseEntity { customerId: EntityId; planId: EntityId; status: Extract<EntityStatus, "ACTIVE" | "EXPIRED" | "SUSPENDED" | "PENDING">; startsAt: ISODateString; expiresAt: ISODateString }
export interface Payment extends BaseEntity { customerId: EntityId; subscriptionId?: EntityId; reference: string; amountMinor: number; currency: "GHS"; status: Extract<EntityStatus, "SUCCESS" | "FAILED" | "PENDING">; paidAt?: ISODateString }
export interface Device extends BaseEntity { customerId: EntityId; name: string; type: string; status: Extract<EntityStatus, "AUTHORIZED" | "PENDING" | "BLOCKED">; lastSeenAt?: ISODateString; usageBytes: number }
export interface Session extends BaseEntity { customerId: EntityId; deviceId: EntityId; networkNodeId: EntityId; status: "ACTIVE" | "DISCONNECTED"; connectedAt: ISODateString; disconnectedAt?: ISODateString }
export interface NetworkNode extends BaseEntity { name: string; type: "CORE" | "ACCESS"; status: Extract<EntityStatus, "ONLINE" | "DEGRADED" | "OFFLINE">; latencyMs: number; clientCount: number }
export interface Notification extends BaseEntity { recipientId: EntityId; title: string; body: string; readAt?: ISODateString }
export interface AuditLog extends BaseEntity { actorId: EntityId; action: string; resourceType: string; resourceId?: EntityId; metadata?: Record<string, unknown> }

export type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: ServiceError }
export type ServiceErrorCode = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION" | "NETWORK" | "INTERNAL"
export interface ServiceError { code: ServiceErrorCode; message: string }
export const serviceError = (code: ServiceErrorCode, message: string): ServiceResult<never> => ({ ok: false, error: { code, message } })
export const serviceSuccess = <T>(data: T): ServiceResult<T> => ({ ok: true, data })
export const isServiceError = <T>(result: ServiceResult<T>): result is { ok: false; error: ServiceError } => !result.ok

export interface SupabaseConfig { url?: string; anonKey?: string; configured: boolean }
export function getSupabaseConfig(): SupabaseConfig { const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; return { url, anonKey, configured: Boolean(url && anonKey) } }
export const requiredSupabaseEnv = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"] as const

export interface PaymentService { createPayment(input: { customerId: EntityId; planId: EntityId }): Promise<ServiceResult<Payment>>; verifyPayment(reference: string): Promise<ServiceResult<Payment>>; handlePaymentWebhook(payload: unknown, signature: string): Promise<ServiceResult<{ accepted: boolean }>> }
export interface SubscriptionService { createSubscription(customerId: EntityId, planId: EntityId): Promise<ServiceResult<Subscription>>; activateSubscription(subscriptionId: EntityId): Promise<ServiceResult<Subscription>>; renewSubscription(subscriptionId: EntityId): Promise<ServiceResult<Subscription>>; expireSubscription(subscriptionId: EntityId): Promise<ServiceResult<Subscription>>; suspendSubscription(subscriptionId: EntityId): Promise<ServiceResult<Subscription>> }
export interface NetworkService { authorizeDevice(deviceId: EntityId): Promise<ServiceResult<{ authorized: boolean }>>; revokeDevice(deviceId: EntityId): Promise<ServiceResult<{ revoked: boolean }>>; getDeviceStatus(deviceId: EntityId): Promise<ServiceResult<Device["status"]>>; disconnectSession(sessionId: EntityId): Promise<ServiceResult<{ disconnected: boolean }>>; getNetworkStatus(): Promise<ServiceResult<NetworkNode[]>> }
export interface NotificationService { sendNotification(input: { recipientId: EntityId; title: string; body: string }): Promise<ServiceResult<Notification>> }
export interface DataAccess<T> { list(): Promise<ServiceResult<T[]>>; getById(id: EntityId): Promise<ServiceResult<T>> }
