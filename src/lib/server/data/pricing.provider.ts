import {
	leftoverPricing,
	fitAreaPricing,
	getFabricPrice,
	getMoldPrice,
	areaPricing
} from './static-pricing';
import type { ListPriceDto } from '../repository/dto/list-price.dto';
import { ListPricingRepository } from '../repository/list-pricing.repository';
import { PricingFormula, PricingType } from '../../type/pricing.type';
import { InvalidSizeError } from '../error/invalid-size.error';

export class PricingProvider {
	private listPricingRepository: ListPricingRepository;

	private readonly fabricPricingDto: ListPriceDto = {
		id: 'fabric',
		price: 0,
		description: 'Estirar tela',
		type: PricingType.FABRIC,
		formula: PricingFormula.NONE,
		areas: [],
		maxD1: 300,
		maxD2: 250
	};

	constructor() {
		this.listPricingRepository = new ListPricingRepository();
	}

	public async getPricingList(type: PricingType): Promise<ListPriceDto[]> {
		const prices = await this.listPricingRepository.getAllPricesByType(type);
		return prices;
	}

	public async calculatePrice(
		pricingType: PricingType,
		d1d: number,
		d2d: number,
		id?: string
	): Promise<{ price: number; description: string }> {
		const { d1, d2 } = PricingProvider.cleanAndOrder(d1d, d2d);
		if (id == null && pricingType !== PricingType.FABRIC) throw Error('Id is required');

		const pricingDto =
			pricingType === PricingType.FABRIC
				? this.fabricPricingDto
				: await this.getPriceFromListById(pricingType, id!);

		PricingProvider.checkMaxMinDimensions(d1, d2, pricingDto);
		const price = PricingProvider.getPriceByType(d1, d2, pricingDto);
		return { price, description: pricingDto.description };
	}

	public async getPriceFromListById(pricingType: PricingType, id: string): Promise<ListPriceDto> {
		const priceDto = await this.listPricingRepository.getByTypeAndId(pricingType, id);
		if (priceDto == null) {
			throw Error('Price not found');
		}

		return priceDto;
	}

	private static getPriceByType(d1: number, d2: number, priceInfo: ListPriceDto): number {
		switch (priceInfo.type) {
			case PricingType.MOLD:
				return getMoldPrice(priceInfo.price, d1, d2);
			case PricingType.FABRIC:
				return getFabricPrice(d1, d2);
			case PricingType.BACK:
			case PricingType.GLASS:
			case PricingType.PP:
				return PricingProvider.getPriceByFormula(priceInfo, d1, d2);
			default:
				throw Error('Pricing type not supported');
		}
	}

	private static getPriceByFormula(priceInfo: ListPriceDto, d1: number, d2: number): number {
		switch (priceInfo.formula) {
			case PricingFormula.FORMULA_LEFTOVER:
				return leftoverPricing(priceInfo.price, d1, d2);
			case PricingFormula.FORMULA_FIT_AREA:
				return fitAreaPricing(priceInfo, d1, d2);
			case PricingFormula.FORMULA_AREA:
				return areaPricing(priceInfo.price, d1, d2);
			default:
				throw Error('Formula not found');
		}
	}

	private static cleanAndOrder(d1d: number, d2d: number) {
		const max = Math.max(d1d, d2d);
		const min = Math.min(d1d, d2d);
		return { d1: Math.floor(max), d2: Math.floor(min) };
	}

	private static checkMaxMinDimensions(d1w: number, d2w: number, pricing: ListPriceDto) {
		if (pricing.maxD1 != null && pricing.maxD2 != null) {
			const { d1, d2 } = PricingProvider.cleanAndOrder(pricing.maxD1, pricing.maxD2);
			if (d1w > d1 || d2w > d2)
				throw new InvalidSizeError(
					`Dimensiones máximas superadas para ${pricing.description} (${pricing.id}). Max: ${d1}x${d2}`
				);
		}
		if (d1w < 15 || d2w < 15)
			throw new InvalidSizeError(
				`Dimensiones mínimas no alcanzadas para ${pricing.description} (${pricing.id}). Min: 15x15`
			);
	}
}