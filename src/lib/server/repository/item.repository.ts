import type { ItemDto } from './dto/item.dto';
import { DynamoRepository } from './dynamo.repository';
import { env } from '../config/env';

export class ItemRepository extends DynamoRepository<ItemDto> {
	constructor() {
		super(env.itemOrderTable, 'orderUuid', 'itemUuid');
	}

	public async getItemById(orderUuid: string, itemUuid: string): Promise<ItemDto | null> {
		const dto = await this.get(orderUuid, itemUuid);
		if (dto && !dto.deleted) {
			return dto;
		}

		return null;
	}

	public async getItemsByOrderId(orderUuid: string): Promise<ItemDto[]> {
		const dtos = await this.getByPartitionKey(orderUuid);
		return dtos.filter((dto) => !dto.deleted);
	}

	public async createItem(item: ItemDto) {
		await this.put(item);
	}

	public async setItemDeleted(deleted: boolean, item: ItemDto) {
		this.setDeleted(deleted, item.orderUuid, item.itemUuid);
	}
}
