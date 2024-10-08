import { ORDER_AUDIT_TRAIL_TABLE } from '$env/static/private';

import type { OrderAuditTrailEntryDto } from './dto/order-audit-trail-entry.dto';
import { DynamoRepository } from './dynamo.repository';

export class OrderAuditTrailRepository extends DynamoRepository<OrderAuditTrailEntryDto> {
	constructor() {
		super(ORDER_AUDIT_TRAIL_TABLE, 'orderUuid', 'timestamp');
	}

	async createOrderAuditTrailEntry(dto: OrderAuditTrailEntryDto) {
		this.put(dto);
	}

	async getOrderAuditTrailEntries(orderUuid: string): Promise<OrderAuditTrailEntryDto[]> {
		return this.getByPartitionKey(orderUuid, false);
	}
}
