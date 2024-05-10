import type { PageServerLoad } from '../$types';
import { OrderService } from '$lib/server/service/order.service';
import { CalculatedItemService } from '$lib/server/service/calculated-item.service';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ params, url }) => {
	const { id } = params as { id: string };
	const shouldPrint = url.searchParams.get('print') != null;

	if (id == null) {
		throw redirect(303, 'https://marcsimoldures.com/');
	}

	try {
		const order = await OrderService.getPublicOrder(id);
		if (order == null) {
			throw redirect(303, 'https://marcsimoldures.com/');
		}

		const calculatedItemService = new CalculatedItemService();
		return {
			shouldPrint,
			order,
			calculatedItem: await calculatedItemService.getCalculatedItem(order.id)
		};
	} catch (error) {
		throw redirect(303, 'https://marcsimoldures.com/');
	}
}) satisfies PageServerLoad;
