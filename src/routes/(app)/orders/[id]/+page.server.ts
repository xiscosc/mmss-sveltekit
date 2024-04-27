import { AuthService } from '$lib/server/service/auth.service';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, RouteParams } from './$types';
import { OrderService } from '$lib/server/service/order.service';
import { CalculatedItemService } from '$lib/server/service/calculated-item.service';
import { OrderStatus } from '$lib/type/order.type';
import type { Order } from '$lib/type/api.type';

async function setOrderStatus(
	status: OrderStatus,
	params: RouteParams,
	locals: App.Locals
): Promise<Order> {
	const session = await locals.auth();
	const appUser = AuthService.generateUserFromAuth(session?.user);
	if (!appUser) throw redirect(303, '/auth/signin');
	const { id } = params;

	const orderService = new OrderService(appUser);

	const order = await orderService.getOrderById(id);
	if (!order) {
		throw fail(500, { missing: true });
	}

	await orderService.setOrderStatus(order, status);
	return order;
}

export const load = (async ({ params, locals }) => {
	const session = await locals.auth();
	const appUser = AuthService.generateUserFromAuth(session?.user);
	if (!appUser) throw redirect(303, '/auth/signin');
	const { id } = params;
	const orderService = new OrderService(appUser);
	const calculatedItemService = new CalculatedItemService();

	return {
		order: await orderService.getOrderById(id),
		calculatedItem: await calculatedItemService.getCalculatedItem(id)
	};
}) satisfies PageServerLoad;

export const actions = {
	async deleteOrder({ params, locals }) {
		await setOrderStatus(OrderStatus.DELETED, params, locals);
		redirect(303, `/`);
	},

	async payOrderFull({ params, locals }) {
		const session = await locals.auth();
		const appUser = AuthService.generateUserFromAuth(session?.user);
		if (!appUser) throw redirect(303, '/auth/signin');
		const { id } = params;
		const orderService = new OrderService(appUser);

		const order = await orderService.getOrderById(id);
		if (!order) {
			return fail(500, { missing: true });
		}

		await orderService.setOrderFullyPaid(order);
	},

	async unpayOrder({ params, locals }) {
		const session = await locals.auth();
		const appUser = AuthService.generateUserFromAuth(session?.user);
		if (!appUser) throw redirect(303, '/auth/signin');
		const { id } = params;

		const orderService = new OrderService(appUser);
		const order = await orderService.getOrderById(id);
		if (!order) {
			return fail(500, { missing: true });
		}

		await orderService.setOrderPartiallyPaid(order, 0);
	},

	async payOrderPartially({ params, locals, request }) {
		const session = await locals.auth();
		const appUser = AuthService.generateUserFromAuth(session?.user);
		if (!appUser) throw redirect(303, '/auth/signin');
		const { id } = params;
		const data = await request.formData();
		const amount = data.get('amount')?.toString();

		if (amount == null) {
			return fail(400, { missing: true });
		}

		const amountNumber = parseFloat(amount);
		if (isNaN(amountNumber) || amountNumber < 0) {
			return fail(400, { invalid: true });
		}

		const orderService = new OrderService(appUser);

		const order = await orderService.getOrderById(id);
		if (!order) {
			return fail(500, { missing: true });
		}

		await orderService.incrementOrderPayment(order, amountNumber);
	},
	async setOrderFinished({ params, locals }) {
		await setOrderStatus(OrderStatus.FINISHED, params, locals);
	},
	async setOrderPending({ params, locals }) {
		await setOrderStatus(OrderStatus.PENDING, params, locals);
	},
	async setOrderPickedUp({ params, locals }): Promise<Order> {
		return await setOrderStatus(OrderStatus.PICKED_UP, params, locals);
	}
};
