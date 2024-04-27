<script lang="ts">
	import type { PageData } from './$types';
	import { DateTime } from 'luxon';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { Icon } from 'svelte-awesome';
	import { faMessage } from '@fortawesome/free-solid-svg-icons/faMessage';
	import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck';
	import { faMoneyBill } from '@fortawesome/free-solid-svg-icons/faMoneyBill';
	import { faTruckPickup } from '@fortawesome/free-solid-svg-icons/faTruckPickup';
	import { faClockRotateLeft } from '@fortawesome/free-solid-svg-icons/faClockRotateLeft';
	import { faPrint } from '@fortawesome/free-solid-svg-icons/faPrint';
	import plus from 'svelte-awesome/icons/plus';
	import trash from 'svelte-awesome/icons/trash';

	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import OrderId from '$lib/components/OrderId.svelte';
	import { isOrderTemp, orderStatusMap } from '$lib/shared/order.utilities';
	import Spacer from '$lib/components/item/Spacer.svelte';
	import type { Item } from '$lib/type/api.type';
	import { CalculatedItemUtilities } from '$lib/shared/calculated-item.utilites';
	import { OrderStatus } from '$lib/type/order.type';

	let formLoading = false;

	export let data: PageData;

	function getWorkingDimensions(item: Item): string {
		const { totalWidth, totalHeight } = CalculatedItemUtilities.getTotalDimensions(
			item.width,
			item.height,
			item.pp,
			item.ppDimensions
		);

		return `${totalHeight}x${totalWidth} cm`;
	}
</script>

<div class="space flex w-full flex-col p-3">
	{#if data.order == null}
		<span class="p-5 text-2xl text-red-700">Cliente o pedido no encontrado</span>
	{:else if isOrderTemp(data.order)}
		{goto(`/orders/${data.order.id}/link`)}
	{:else}
		<span class="pb-1 text-xl text-gray-700"
			>{data.order.customer.name} | <OrderId order={data.order} /></span
		>
		{#if !formLoading}
			<div
				class="flex w-full flex-col place-content-center items-center justify-center gap-1 md:grid md:grid-cols-2 lg:grid-cols-3"
			>
				<a
					class="variant-filled-success btn btn-sm w-full"
					href={`/orders/${data?.order?.id}/print`}
					><Icon class="mr-1" data={faPrint} /> Imprimir pedido
				</a>
				<form
					class="w-full"
					method="post"
					action="?/deleteOrder"
					use:enhance={() => {
						formLoading = true;
						return async ({ update }) => {
							await update();
							formLoading = false;
						};
					}}
				>
					<button class="variant-filled-error btn btn-sm w-full"
						><Icon class="mr-1" data={trash} />Eliminar pedido</button
					>
				</form>
				{#if data.order.status !== OrderStatus.FINISHED}
					<form
						class="w-full"
						method="post"
						action="?/setOrderFinished"
						use:enhance={() => {
							formLoading = true;
							return async ({ update }) => {
								await update();
								formLoading = false;
							};
						}}
					>
						<button class="variant-ghost-primary btn btn-sm w-full"
							><Icon class="mr-1" data={faCheck} />Marcar como finalizado</button
						>
					</form>
				{/if}
				{#if data.order.status !== OrderStatus.PENDING}
					<form
						class="w-full"
						method="post"
						action="?/setOrderPending"
						use:enhance={() => {
							formLoading = true;
							return async ({ update }) => {
								await update();
								formLoading = false;
							};
						}}
					>
						<button class="variant-ghost btn btn-sm w-full"
							><Icon class="mr-1" data={faClockRotateLeft} />Marcar como pendiente</button
						>
					</form>
				{/if}
				{#if data.order.status !== OrderStatus.PICKED_UP}
					<form
						class="w-full"
						method="post"
						action="?/setOrderPickedUp"
						use:enhance={() => {
							formLoading = true;
							return async ({ update }) => {
								await update();
								formLoading = false;
							};
						}}
					>
						<button class="variant-ghost-tertiary btn btn-sm w-full"
							><Icon class="mr-1" data={faTruckPickup} />Marcar como recogido</button
						>
					</form>
				{/if}
				<a
					class="variant-filled-warning btn btn-sm w-full"
					href="/customers/{data.order.customer.id}/orders/new"
					><Icon class="mr-1" data={plus} />Nuevo pedido para cliente</a
				>
				<button
					class="variant-filled btn btn-sm w-full"
					on:click={() => {
						goto(`/orders/${data?.order?.id}/day`);
					}}
					><Icon class="mr-1" data={faMessage} /> Notificar pedidos finalizados
				</button>

				{#if data.order.amountPayed === data.calculatedItem?.total}
					<form
						class="w-full"
						method="post"
						action="?/unpayOrder"
						use:enhance={() => {
							formLoading = true;
							return async ({ update }) => {
								await update();
								formLoading = false;
							};
						}}
					>
						<button class="variant-filled-secondary btn btn-sm w-full" disabled={formLoading}
							><Icon class="mr-1" data={faMoneyBill} />Marcar como no pagado</button
						>
					</form>
				{:else}
					<form
						class="w-full"
						method="post"
						action="?/payOrderFull"
						use:enhance={() => {
							formLoading = true;
							return async ({ update }) => {
								await update();
								formLoading = false;
							};
						}}
					>
						<button class="variant-filled-secondary btn btn-sm w-full"
							><Icon class="mr-1" data={faMoneyBill} />Marcar como pagado</button
						>
					</form>
					<form
						class="grid w-full grid-cols-2 gap-1"
						method="post"
						action="?/payOrderPartially"
						use:enhance={() => {
							formLoading = true;
							return async ({ update }) => {
								await update();
								formLoading = false;
							};
						}}
					>
						<div
							class="input-group input-group-divider grid-cols-[auto_1fr_auto]"
							style="height: 32px;"
						>
							<div class="input-group-shim">€</div>
							<input type="number" class="pt-1" name="amount" placeholder="Cantidad" step="0.1" />
						</div>
						<button class="variant-filled-secondary btn btn-sm"
							><Icon class="mr-1" data={faMoneyBill} />Añadir pago a cuenta</button
						>
					</form>
				{/if}
			</div>
		{/if}

		{#if formLoading}
			<ProgressBar text={'Aplicando cambios...'} />
		{/if}

		<Spacer title={'Datos del pedido'} />
		<div class="flex w-full flex-col space-y-1">
			<span class="text-md text-gray-700"
				>Estado: <span
					class="badge"
					class:variant-ghost={OrderStatus.PENDING === data.order.status}
					class:variant-ghost-primary={OrderStatus.FINISHED === data.order.status}
					class:variant-ghost-tertiary={OrderStatus.PICKED_UP === data.order.status}
				>
					{orderStatusMap[data.order.status] +
						' ' +
						DateTime.fromJSDate(data.order.statusUpdated).toFormat('dd/MM/yyyy HH:mm')}
				</span>
			</span>
			<span class="text-md text-gray-700"
				>Unidades: <span class="variant-ghost badge">{data.order.item.quantity}</span></span
			>
			<span class="text-md text-gray-700">Dependiente: {data.order.userName}</span>
			<span class="text-md text-gray-700"
				>Fecha y hora: {DateTime.fromJSDate(data.order.createdAt).toFormat(
					'dd/MM/yyyy HH:mm'
				)}</span
			>
			<span class="text-md text-gray-700"
				>Fecha de entrega: {DateTime.fromJSDate(data.order.item.deliveryDate).toFormat(
					'dd/MM/yyyy'
				)}</span
			>
			<span class="text-md text-gray-700"
				>Medidas de la obra: {`${data.order.item.height}x${data.order.item.width} cm`}</span
			>
			<span class="text-md text-gray-700"
				>Medidas de trabajo: {getWorkingDimensions(data.order.item)}</span
			>
			<span class="text-md text-gray-700">Descripción: {data.order.item.description}</span>
			<span class="text-md text-gray-700">Observaciones: {data.order.item.observations}</span>
			{#each data.order.item.predefinedObservations as obv}
				<span class="text-md text-gray-700">- {obv}</span>
			{/each}
			<Spacer title={'Elementos'} />
			{#if data.calculatedItem}
				{#each data.calculatedItem.parts as part}
					<span class="text-md text-gray-700">
						- {part.description}
						<span class="variant-ghost badge">{part.price.toFixed(2)}€</span>
						{#if part.quantity > 1}
							<span class="variant-ghost badge">x{part.quantity} </span>
						{/if}
					</span>
				{/each}

				{#if data.calculatedItem.quantity > 1}<span class="text-md text-gray-700">
						Precio unitario: <span class="variant-ghost badge"
							>{data.calculatedItem.total / data.calculatedItem.quantity}€</span
						>
					</span>
				{/if}
				{#if data.calculatedItem.discount > 0}<span class="text-md text-gray-700">
						Descuento: <span class="variant-ghost badge">{data.calculatedItem.discount}%</span>
					</span>
				{/if}
				<span class="variant-ghost badge">Total {data.calculatedItem.total.toFixed(2)}€</span>
				{#if data.order.amountPayed === 0}
					<span class="variant-ghost-warning badge"> No pagado </span>
				{:else if data.order.amountPayed === data.calculatedItem.total}
					<span class="variant-ghost-success badge"> Pagado </span>
				{:else}
					<span class="variant-ghost-secondary badge">
						{data.order.amountPayed.toFixed(2)}€ pagado - {(
							data.calculatedItem.total - data.order.amountPayed
						).toFixed(2)}€ pendiente
					</span>
				{/if}
			{/if}
		</div>
	{/if}
</div>