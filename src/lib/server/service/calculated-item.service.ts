import { PricingService } from './pricing.service';
import { CalculatedItemRepository } from '../repository/calculated-item.repository';
import type { CalculatedItemDto } from '../repository/dto/calculated-item.dto';
import type {
	CalculatedItem,
	CalculatedItemPart,
	Item,
	Order,
	PreCalculatedItemPart
} from '../../type/api.type';
import { PricingType } from '../../type/pricing.type';
import { CalculatedItemUtilities } from '$lib/shared/calculated-item.utilites';

export class CalculatedItemService {
	private calculatedItemRepository: CalculatedItemRepository;
	private pricingProvider: PricingService;

	constructor() {
		this.calculatedItemRepository = new CalculatedItemRepository();
		this.pricingProvider = new PricingService();
	}

	public async getCalculatedItem(itemId: string): Promise<CalculatedItem | null> {
		const dto = await this.calculatedItemRepository.getCalculatedItemById(itemId);
		return dto ? CalculatedItemService.fromDto(dto) : null;
	}

	public async createCalculatedItem(
		order: Order,
		item: Item,
		discount: number,
		extraParts: CalculatedItemPart[]
	): Promise<CalculatedItem> {
		const calculatedItem: CalculatedItem = {
			orderId: order.id,
			discount,
			parts: [],
			total: 0
		};

		const { workingWidth, workingHeight } = CalculatedItemUtilities.getWorkingDimensions(
			item.width,
			item.height,
			item.pp,
			item.ppDimensions
		);

		const partPromises: Promise<CalculatedItemPart>[] = item.partsToCalculate.map((p) =>
			this.calculatePart(p, workingWidth, workingHeight)
		);

		const parts = await Promise.all(partPromises);
		calculatedItem.parts.push(...parts);
		calculatedItem.parts.push(...extraParts);
		calculatedItem.total = CalculatedItemService.getTotalPrice(calculatedItem, item);
		return calculatedItem;
	}

	public async calculatePart(
		partToCalculate: PreCalculatedItemPart,
		width: number,
		height: number
	): Promise<CalculatedItemPart> {
		const pricingResult = await this.pricingProvider.calculatePrice(
			partToCalculate.type,
			width,
			height,
			partToCalculate.id
		);

		return {
			price: pricingResult.price,
			quantity: partToCalculate.quantity,
			description: CalculatedItemService.getDefaultDescriptionByType(
				partToCalculate.type,
				partToCalculate.id,
				pricingResult.description
			)
		};
	}

	public async saveCalculatedItem(calculatedItem: CalculatedItem): Promise<void> {
		await this.calculatedItemRepository.createCalculatedItem(
			CalculatedItemService.toDto(calculatedItem)
		);
	}

	private static getTotalPrice(calculatedItem: CalculatedItem, item: Item): number {
		const subtotal = calculatedItem.parts.reduce(
			(total, part) => total + part.price * part.quantity,
			0
		);
		const totalPrice = item.quantity * subtotal * (1 - calculatedItem.discount / 100);
		return Math.ceil(totalPrice * 100) / 100;
	}

	private static fromDto(dto: CalculatedItemDto): CalculatedItem {
		return {
			orderId: dto.orderUuid,
			discount: dto.discount,
			parts: dto.parts,
			total: dto.total
		};
	}

	private static toDto(calculatedItem: CalculatedItem): CalculatedItemDto {
		return {
			orderUuid: calculatedItem.orderId,
			discount: calculatedItem.discount,
			parts: calculatedItem.parts,
			total: calculatedItem.total
		};
	}

	private static getDefaultDescriptionByType(
		type: PricingType,
		id: string,
		description?: string
	): string {
		switch (type) {
			case PricingType.MOLD:
				return CalculatedItemService.getMoldDescription(id);
			case PricingType.GLASS:
				return CalculatedItemService.getDefaultDescription(`Cristal ${id}`, description);
			case PricingType.BACK:
				return CalculatedItemService.getDefaultDescription(`Trasera ${id}`, description);
			case PricingType.PP:
				return CalculatedItemService.getDefaultDescription(`Passepartout ${id}`, description);
			case PricingType.FABRIC:
				return `Estirar tela`;
			case PricingType.OTHER:
				return CalculatedItemService.getDefaultDescription(`${id}`, description);
			default:
				throw Error('Invalid type');
		}
	}

	private static getDefaultDescription(df: string, description?: string): string {
		if (!description || description.trim() === '') {
			return df;
		}

		return description;
	}

	private static getMoldDescription(moldId: string): string {
		const before_ = moldId.split('_')[0];
		const after_ = moldId.split('_')[1];
		return `Ubi: ${before_} - Moldura: ${after_}`;
	}
}
