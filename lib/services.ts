import { customer, devices, nodes, payments, plan, subscription } from "@/lib/stillacon-data"
import type { DataAccess, Device, EntityId, NetworkNode, NetworkService, PaymentService, SubscriptionService, NotificationService, ServiceResult } from "@/lib/domain"
import { serviceSuccess } from "@/lib/domain"

export const demoCustomerRepository: DataAccess<typeof customer> = { async list() { return serviceSuccess([customer]) }, async getById() { return serviceSuccess(customer) } }
export const demoDeviceRepository: DataAccess<Device> = { async list() { return serviceSuccess(devices.map((device, index) => ({ id: `device-${index + 1}`, createdAt: "2026-09-01T00:00:00.000Z", updatedAt: "2026-09-16T00:00:00.000Z", customerId: customer.id, name: device.name, type: device.type, status: device.status, usageBytes: 0 }))) }, async getById(id) { const found = (await this.list()).ok ? (await this.list() as { ok: true; data: Device[] }).data.find(device => device.id === id) : undefined; return found ? serviceSuccess(found) : { ok: false, error: { code: "NOT_FOUND", message: "Device not found." } } } }

export const demoPaymentService: PaymentService = { async createPayment() { return serviceSuccess({ ...payments[0], id: payments[0].ref, createdAt: "2026-09-01T00:00:00.000Z", updatedAt: "2026-09-01T00:00:00.000Z", customerId: customer.id, reference: payments[0].ref, amountMinor: 14900, currency: "GHS", status: "SUCCESS" }) }, async verifyPayment() { return serviceSuccess({ ...payments[0], id: payments[0].ref, createdAt: "2026-09-01T00:00:00.000Z", updatedAt: "2026-09-01T00:00:00.000Z", customerId: customer.id, reference: payments[0].ref, amountMinor: 14900, currency: "GHS", status: "SUCCESS" }) }, async handlePaymentWebhook() { return serviceSuccess({ accepted: false }) } }
export const demoSubscriptionService: SubscriptionService = { async createSubscription() { return serviceSuccess({ ...subscription, id: "subscription-demo", createdAt: "2026-09-01T00:00:00.000Z", updatedAt: "2026-09-01T00:00:00.000Z", customerId: customer.id, planId: plan.name, startsAt: "2026-09-01T00:00:00.000Z", expiresAt: "2026-09-30T23:59:59.000Z" }) }, async activateSubscription(id) { return this.createSubscription(customer.id, id) }, async renewSubscription(id) { return this.createSubscription(customer.id, id) }, async expireSubscription(id) { return this.createSubscription(customer.id, id) }, async suspendSubscription(id) { return this.createSubscription(customer.id, id) } }
export const demoNetworkService: NetworkService = { async authorizeDevice() { return serviceSuccess({ authorized: true }) }, async revokeDevice() { return serviceSuccess({ revoked: true }) }, async getDeviceStatus() { return serviceSuccess("AUTHORIZED") }, async disconnectSession() { return serviceSuccess({ disconnected: true }) }, async getNetworkStatus() { return serviceSuccess<NetworkNode[]>(nodes.map((node, index) => ({ id: `node-${index + 1}`, createdAt: "2026-09-01T00:00:00.000Z", updatedAt: "2026-09-16T00:00:00.000Z", name: node.name, type: node.type as NetworkNode["type"], status: node.status as NetworkNode["status"], latencyMs: Number.parseInt(node.latency), clientCount: Number(node.clients) }))) } }
export const demoNotificationService: NotificationService = { async sendNotification(input) { return serviceSuccess({ ...input, id: "notification-demo", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }) } }

export interface StillaconServices { payments: PaymentService; subscriptions: SubscriptionService; network: NetworkService; notifications: NotificationService }
export const services: StillaconServices = { payments: demoPaymentService, subscriptions: demoSubscriptionService, network: demoNetworkService, notifications: demoNotificationService }

export async function getCustomerDashboardView() {
  return { customer, devices, payments, plan, subscription }
}

export type { EntityId }
