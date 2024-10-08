import { fail, redirect } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { PricingService } from '$lib/server/service/pricing.service.js';
import {
	PricingUtilites,
	listPriceSchemaEdit,
	type EditablePricingTypes
} from '$lib/shared/pricing.utilites';
import type { ListPrice, MaxArea, MaxAreaM2 } from '$lib/type/api.type.js';
import { AuthUtilities } from '$lib/server/shared/auth/auth.utilites';
import { PricingFormula, PricingType } from '$lib/type/pricing.type';

async function getListPrice(id: string): Promise<ListPrice> {
	if (id == null) throw fail(400);
	const pricingService = new PricingService();
	const pricing = await pricingService.getPriceListByInternalId(id);
	if (pricing == null) {
		throw redirect(302, '/config/prices/list');
	}
	return pricing;
}

export const load = async ({ locals, params }) => {
	await AuthUtilities.checkAuth(locals, true);
	const { id } = params;
	const listPrice = await getListPrice(id);
	const form = await superValidate(zod(listPriceSchemaEdit));
	form.data.id = listPrice.id;
	form.data.price = listPrice.price;
	form.data.description = listPrice.description;
	form.data.type = listPrice.type as EditablePricingTypes;
	form.data.formula = listPrice.formula;
	form.data.minPrice = listPrice.minPrice;
	form.data.areas = listPrice.areas;
	form.data.maxD1 = listPrice.maxD1;
	form.data.maxD2 = listPrice.maxD2;
	form.data.areasM2 = listPrice.areasM2;
	form.data.priority = listPrice.priority;
	form.data.discountAllowed = listPrice.discountAllowed;
	return { form };
};

export const actions = {
	async createOrEdit({ request, locals, params }) {
		await AuthUtilities.checkAuth(locals);

		const form = await superValidate(request, zod(listPriceSchemaEdit));
		if (!form.valid) {
			return fail(400, { form });
		}

		const { id } = params;
		const listPrice = await getListPrice(id);
		const pricingService = new PricingService();

		const { price, maxD1, maxD2, areas, areasM2 } = PricingUtilites.cleanFormValues(
			form as unknown as {
				data: {
					formula: PricingFormula;
					areas: MaxArea[];
					areasM2: MaxAreaM2[];
					price: number;
					maxD1: number;
					maxD2: number;
				};
			}
		);

		try {
			listPrice.price = price;
			listPrice.minPrice = form.data.minPrice;
			listPrice.description = form.data.description;
			listPrice.type = form.data.type as PricingType;
			listPrice.formula = form.data.formula;
			listPrice.areas = areas;
			listPrice.maxD1 = maxD1;
			listPrice.maxD2 = maxD2;
			listPrice.areasM2 = areasM2;
			listPrice.priority = form.data.priority;
			listPrice.discountAllowed = form.data.discountAllowed;
			await pricingService.updatePricing(listPrice);
		} catch (error: unknown) {
			return setError(form, '', 'Error actualizando el item. Intente de nuevo.');
		}

		return redirect(302, `/config/prices/list?type=${listPrice.type}`);
	},
	async deletePrice({ locals, params }) {
		await AuthUtilities.checkAuth(locals, true);
		const { id } = params;
		const listPrice = await getListPrice(id);
		const pricingService = new PricingService();
		await pricingService.deleteListPrices(listPrice.type, [listPrice.id]);
		return redirect(302, `/config/prices/list?type=${listPrice.type}`);
	}
};
