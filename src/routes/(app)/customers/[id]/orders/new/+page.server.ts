import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { OrderService } from '$lib/server/service/order.service';
import { zod } from 'sveltekit-superforms/adapters';
import { superValidate, setError } from 'sveltekit-superforms';
import { PricingType } from '$lib/type/pricing.type';
import { InvalidSizeError } from '$lib/server/error/invalid-size.error';
import { PricingHelper } from '$lib/server/shared/pricing/pricing.helper';
import { itemSchema } from '$lib/shared/order.utilities';
import { AuthUtilities } from '$lib/server/shared/auth/auth.utilites';

export const load = (async ({ locals }) => {
	await AuthUtilities.checkAuth(locals);
	const form = await superValidate(zod(itemSchema));
	const pricing = PricingHelper.getPricing();

	return { form, pricing };
}) satisfies PageServerLoad;

export const actions = {
	async default({ request, locals, params }) {
		const appUser = await AuthUtilities.checkAuth(locals);

		const form = await superValidate(request, zod(itemSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		const { id } = params;
		const orderService = new OrderService(appUser);
		const partsToCalculate = form.data.partsToCalculate.map((part) => ({
			id: part.id,
			quantity: part.quantity,
			type: part.type as PricingType,
			moldId: part.moldId,
			extraInfo: part.extraInfo
		}));

		let orderId = '';

		try {
			const order = await orderService.createOrderForCustomer(
				id,
				form.data.width,
				form.data.height,
				form.data.pp ?? 0,
				form.data.description,
				form.data.predefinedObservations,
				form.data.observations,
				form.data.quantity,
				form.data.deliveryDate,
				partsToCalculate,
				form.data.extraParts,
				form.data.discount,
				form.data.hasArrow,
				form.data.ppDimensions,
				form.data.exteriorWidth,
				form.data.exteriorHeight
			);

			if (!order) {
				return setError(form, '', 'Error creando el pedido. Intente de nuevo.');
			}

			orderId = order.id;
		} catch (error: unknown) {
			console.log(error);
			if (error instanceof InvalidSizeError) {
				return setError(form, '', error.message);
			}

			return setError(form, '', 'Error creando el pedido. Intente de nuevo.');
		}

		return redirect(302, `/orders/${orderId}`);
	}
};
