import { PUBLIC_DOMAIN_URL } from '$env/static/public';
import type { CalculatedItem, Order } from '$lib/type/api.type';
import { OrderStatus } from '$lib/type/order.type';
import { PricingType } from '$lib/type/pricing.type';
import { DateTime } from 'luxon';
import { z } from 'zod';
import { CalculatedItemUtilities, otherExtraId } from './calculated-item.utilites';
import { allPricingTypes } from './pricing.utilites';

export class OrderUtilites {
	public static getOrderPublicId(order: Order): string {
		const date = DateTime.fromJSDate(order.createdAt);
		const dateStr = date.toFormat('ddMMyyyy');
		const phoneWithoutPlus = order.customer.phone.replace('+', '');
		const middle = (order.shortId.charAt(0) + order.id.charAt(0)).toUpperCase();
		return `${dateStr}/${middle}/${phoneWithoutPlus}`;
	}

	public static getOrderMolds(order: Order): string[] {
		return order.item.partsToCalculate
			.filter((p) => p.type === PricingType.MOLD)
			.map(
				(p) =>
					`${CalculatedItemUtilities.getMoldDescription(p.id)} ${p.quantity > 1 ? 'x' + p.quantity : ''}`
			);
	}

	public static getOrderElementByPricingType(
		order: Order,
		calculatedItem: CalculatedItem,
		pricingType: PricingType
	): string[] {
		const ids = order.item.partsToCalculate.filter((p) => p.type === pricingType).map((p) => p.id);

		return calculatedItem.parts
			.filter((p) => ids.indexOf(p.priceId) > -1)
			.map((p) => `${p.description} ${p.quantity > 1 ? 'x' + p.quantity : ''}`);
	}

	public static getExtras(calculatedItem: CalculatedItem): string[] {
		return calculatedItem.parts.filter((p) => p.priceId === otherExtraId).map((p) => p.description);
	}

	public static getWorkingDimensions(order: Order): string {
		const item = order.item;
		const { totalWidth, totalHeight } = CalculatedItemUtilities.getTotalDimensions(
			item.width,
			item.height,
			item.pp,
			item.ppDimensions
		);

		return `${totalHeight}x${totalWidth} cm`;
	}

	public static getWhatsappTicketText(order: Order): string {
		const url = `${PUBLIC_DOMAIN_URL}/s/${order.shortId}`;
		return `Su pedido ${OrderUtilites.getOrderPublicId(order)} ha sido registrado correctamente, puede consultar aquí su resguardo ${url} . Marcs i Moldures Son Sardina.`;
	}

	public static getWhatsappFinishedText(orders: Order[]): string {
		const greeting =
			'Nuestro horario es de lunes a viernes de 09:00 a 18:00 y los sábados de 09:30 a 13:15. Marcs i Moldures Son Sardina.';
		if (orders.length === 1) {
			const url = `${PUBLIC_DOMAIN_URL}/s/${orders[0].shortId}`;
			return `Hemos terminado su pedido ${OrderUtilites.getOrderPublicId(orders[0])}, puede pasar a buscarlo. Aquí tiene el resguardo ${url} . ${greeting}`;
		} else {
			const orderLines = orders
				.map(
					(order) =>
						`${OrderUtilites.getOrderPublicId(order)} - Resguardo ${PUBLIC_DOMAIN_URL}/s/${order.shortId}`
				)
				.join('\n');

			return `Hemos terminado sus pedidos:\n${orderLines}\nPuede pasar a buscarlos. ${greeting}`;
		}
	}

	public static getDiscountRepresentation(discount: number): string {
		switch (discount) {
			case 10:
				return '1';
			case 15:
				return '2';
			case 20:
				return '3';
			case 25:
				return '4';
			case 50:
				return '5';
			default:
				return `${discount}%`;
		}
	}

	public static getYesterday(): Date {
		const now = DateTime.now();
		const yesterday = now.minus({ days: 1 });
		return yesterday.toJSDate();
	}
}

export const tempCustomerUuid = 'temp-customer';

export function isOrderTemp(order: Order): boolean {
	return order.customer.id === tempCustomerUuid;
}

export const orderStatusMap: Record<OrderStatus, string> = {
	[OrderStatus.FINISHED]: 'Finalizado',
	[OrderStatus.PICKED_UP]: 'Recogido',
	[OrderStatus.PENDING]: 'Pendiente',
	[OrderStatus.DELETED]: 'Eliminado'
};

const extraPartSchema = z.object({
	priceId: z.string().default(otherExtraId),
	price: z.number().min(0).default(0),
	quantity: z.number().int().min(1).default(1),
	discountAllowed: z.boolean().default(true),
	description: z.string().default('')
});

const partToCalculateSchema = z.object({
	id: z.string(),
	quantity: z.number().int().min(1).default(1),
	type: z.enum(allPricingTypes as [string, ...string[]]),
	moldId: z.string().optional(),
	extraInfo: z.string().optional()
});

const ppDimensionsSchema = z.object({
	up: z.number().min(0),
	down: z.number().min(0),
	left: z.number().min(0),
	right: z.number().min(0)
});

export const itemSchema = z.object({
	width: z.number().min(15),
	height: z.number().min(15),
	deliveryDate: z.date().min(OrderUtilites.getYesterday()),
	description: z.string().default(''),
	observations: z.string().default(''),
	quantity: z.number().int().min(1).default(1),
	pp: z.coerce.number().min(0).default(0),
	ppDimensions: ppDimensionsSchema.optional(),
	discount: z.number().min(0).default(0),
	extraParts: z.array(extraPartSchema),
	partsToCalculate: z.array(partToCalculateSchema),
	predefinedObservations: z.array(z.string()).default([]),
	hasArrow: z.boolean().default(false),
	exteriorWidth: z.number().optional(),
	exteriorHeight: z.number().optional()
});

export const smsTemplates = {
	orderCreated: 'Su pedido #param1# ha sido creado correctamente. Puede consultarlo en #param2#',
	orderFinished: 'Su pedido #param1# ha sido finalizado. Puede pasar a recogerlo.'
};
