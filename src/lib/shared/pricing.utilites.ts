import type { ListPrice, ListPriceForm, MaxArea, MaxAreaM2 } from '$lib/type/api.type';
import { PricingFormula, PricingType } from '$lib/type/pricing.type';
import { z } from 'zod';

export const fabricIds = {
	labour: 'fabric',
	short: 'fabric_short',
	long: 'fabric_long'
};

export const fabricDefaultPricing: ListPrice = {
	id: fabricIds.labour,
	internalId: '',
	price: 0,
	description: 'Estirar tela',
	type: PricingType.FABRIC,
	formula: PricingFormula.NONE,
	areas: [],
	areasM2: [],
	maxD1: 300,
	maxD2: 250,
	priority: 1
};

export type AllPrices = {
	moldPrices: ListPrice[];
	glassPrices: ListPrice[];
	ppPrices: ListPrice[];
	backPrices: ListPrice[];
	labourPrices: ListPrice[];
	otherPrices: ListPrice[];
};

export const emptyPricing: AllPrices = {
	moldPrices: [],
	glassPrices: [],
	ppPrices: [],
	backPrices: [],
	otherPrices: [],
	labourPrices: []
};

export type EditablePricingTypes =
	| PricingType.BACK
	| PricingType.GLASS
	| PricingType.PP
	| PricingType.LABOUR
	| PricingType.OTHER;

export const pricingTypesMap: Record<EditablePricingTypes, string> = {
	[PricingType.GLASS]: 'Cristal',
	[PricingType.PP]: 'PP',
	[PricingType.OTHER]: 'Otro',
	[PricingType.BACK]: 'Trasera',
	[PricingType.LABOUR]: 'Montajes'
};

export const formulasMap: Record<PricingFormula, string> = {
	[PricingFormula.NONE]: 'Precio unitario sin cálculos',
	[PricingFormula.FORMULA_AREA]: 'Precio por m2',
	[PricingFormula.FORMULA_FIT_AREA_M2]: 'Precio por trozos (≤ m2)',
	[PricingFormula.FORMULA_FIT_AREA]: 'Precio por trozos (≤ d1 x d2)',
	[PricingFormula.FORMULA_LINEAR]: 'Precio por metro lineal (perímetro)',
	[PricingFormula.FORMULA_LEFTOVER]: 'Precio con fórmula m2 * precio * IVA * 5 + 2'
};

export const formulasStringMap: Record<PricingFormula, string> = {
	[PricingFormula.NONE]: '',
	[PricingFormula.FORMULA_AREA]: ' / m2',
	[PricingFormula.FORMULA_FIT_AREA]: '',
	[PricingFormula.FORMULA_FIT_AREA_M2]: '',
	[PricingFormula.FORMULA_LINEAR]: ' / m',
	[PricingFormula.FORMULA_LEFTOVER]: ' * m2 * IVA * 5 + 2'
};

export const fitFormulas = [PricingFormula.FORMULA_FIT_AREA, PricingFormula.FORMULA_FIT_AREA_M2];

const areaSchema = z.object({
	d1: z.number().min(1.0),
	d2: z.number().min(1.0),
	price: z.number().min(0)
});

const areaM2Schema = z.object({
	a: z.number().min(0),
	price: z.number().min(0)
});

const listPriceSchema = {
	id: z
		.string()
		.regex(/^[^\s]*$/, 'id should not contain spaces')
		.min(1),
	price: z.number().min(0),
	description: z.string().min(1),
	type: z.enum([
		PricingType.GLASS,
		PricingType.PP,
		PricingType.BACK,
		PricingType.OTHER,
		PricingType.LABOUR
	]),
	formula: z.enum([
		PricingFormula.FORMULA_LEFTOVER,
		PricingFormula.FORMULA_FIT_AREA,
		PricingFormula.FORMULA_FIT_AREA_M2,
		PricingFormula.FORMULA_AREA,
		PricingFormula.FORMULA_LINEAR,
		PricingFormula.NONE
	]),
	areas: z.array(areaSchema).default([]),
	areasM2: z.array(areaM2Schema).default([]),
	maxD1: z.number().optional(),
	maxD2: z.number().optional(),
	priority: z.number().default(0)
};

export const listPriceSchemaNew = z.object({
	...listPriceSchema,
	type: z.enum([
		PricingType.GLASS,
		PricingType.PP,
		PricingType.BACK,
		PricingType.OTHER,
		PricingType.LABOUR
	])
});

export const listPriceSchemaEdit = z.object({
	...listPriceSchema,
	type: z.enum([
		PricingType.GLASS,
		PricingType.PP,
		PricingType.BACK,
		PricingType.OTHER,
		PricingType.LABOUR,
		PricingType.MOLD
	])
});

export class PricingUtilites {
	static getPriceString(price: ListPrice): string {
		if (price.formula !== PricingFormula.FORMULA_FIT_AREA) {
			return `${price.price.toFixed(2)}€${formulasStringMap[price.formula]}`;
		}

		const prices = price.areas.map((a) => a.price);
		const minPrice = Math.min(...prices);
		const maxPrice = Math.max(...prices);
		return `${minPrice.toFixed(2)}€ - ${maxPrice.toFixed(2)}€`;
	}

	static getFabricCrossbarDimension(id: string, d1: number, d2: number): number {
		return id === fabricIds.long ? Math.max(d1, d2) : Math.min(d1, d2);
	}

	static generateCrossbarPricing(
		id: string,
		price: number,
		moldDescription: string,
		dimension: number,
		moldId: string
	): ListPriceForm {
		return {
			id,
			internalId: '',
			price,
			description: `Travesaño (${moldDescription}) ${dimension}cm`,
			type: PricingType.FABRIC,
			formula: PricingFormula.NONE,
			areas: [],
			areasM2: [],
			maxD1: 300,
			maxD2: 250,
			priority: 1,
			moldId
		};
	}

	static cleanFormValues(form: {
		data: {
			formula: PricingFormula;
			areas: MaxArea[];
			areasM2: MaxAreaM2[];
			price: number;
			maxD1: number;
			maxD2: number;
		};
	}) {
		if (fitFormulas.includes(form.data.formula)) {
			const price = 0;
			const maxD1 = undefined;
			const maxD2 = undefined;
			let areas: MaxArea[] = [];
			let areasM2: MaxAreaM2[] = [];
			if (form.data.formula === PricingFormula.FORMULA_FIT_AREA) {
				areas = form.data.areas;
			}

			if (form.data.formula === PricingFormula.FORMULA_FIT_AREA_M2) {
				areasM2 = form.data.areasM2;
			}
			return { price, maxD1, maxD2, areas, areasM2 };
		} else {
			const price = form.data.price;
			const maxD1 = form.data.maxD1;
			const maxD2 = form.data.maxD2;
			const areas: MaxArea[] = [];
			const areasM2: MaxAreaM2[] = [];
			return { price, maxD1, maxD2, areas, areasM2 };
		}
	}
}
