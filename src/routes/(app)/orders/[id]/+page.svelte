<script lang="ts">
	import type { PageData } from './$types';
	import { DateTime } from 'luxon';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { Icon } from 'svelte-awesome';
	import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck';
	import { faUser } from '@fortawesome/free-solid-svg-icons/faUser';
	import { faWhatsapp } from '@fortawesome/free-brands-svg-icons/faWhatsapp';
	import { faMoneyBill } from '@fortawesome/free-solid-svg-icons/faMoneyBill';
	import { faTruckPickup } from '@fortawesome/free-solid-svg-icons/faTruckPickup';
	import { faCamera } from '@fortawesome/free-solid-svg-icons/faCamera';
	import { faClockRotateLeft } from '@fortawesome/free-solid-svg-icons/faClockRotateLeft';
	import { faPrint } from '@fortawesome/free-solid-svg-icons/faPrint';
	import { faBox } from '@fortawesome/free-solid-svg-icons/faBox';
	import { faUserLarge } from '@fortawesome/free-solid-svg-icons/faUserLarge';
	import trash from 'svelte-awesome/icons/trash';

	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import { OrderUtilites, isOrderTemp, orderStatusMap } from '$lib/shared/order.utilities';
	import Spacer from '$lib/components/item/Spacer.svelte';
	import { OrderStatus } from '$lib/type/order.type';
	import { CalculatedItemUtilities } from '$lib/shared/calculated-item.utilites';
	import { CustomerUtilites } from '$lib/shared/customer.utilities';

	let formLoading = false;

	export let data: PageData;
	const totalOrder = data.calculatedItem
		? CalculatedItemUtilities.getTotal(data.calculatedItem)
		: 0;
</script>

<div class="space flex w-full flex-col p-3">
	{#if data.order == null}
		<span class="p-5 text-2xl text-red-700">Cliente o pedido no encontrado</span>
	{:else if isOrderTemp(data.order)}
		{goto(`/orders/${data.order.id}/link`)}
	{:else}
		<p class="pb-1 text-lg text-gray-700">
			<Icon class="mr-1" data={faUserLarge} />
			{data.order.customer.name}
		</p>
		<p class="text-md pb-1 text-gray-700">
			<Icon class="mr-1" data={faBox} />
			{OrderUtilites.getOrderPublicId(data.order)}
		</p>

		{#if !formLoading}
			<div
				class="flex w-full flex-col place-content-center items-center justify-center gap-1 md:grid md:grid-cols-2 lg:grid-cols-3"
			>
				<a
					class="variant-ghost-warning btn btn-sm w-full"
					target="_blank"
					href={`/orders/${data.order.id}/print`}
					><Icon class="mr-1" data={faPrint} /> Imprimir
				</a>
				{#if data.order.amountPayed === totalOrder}
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
						<button class="variant-filled-secondary btn btn-sm"
							><Icon class="mr-1" data={faMoneyBill} />Añadir pago a cuenta</button
						>
						<div
							class="input-group input-group-divider grid-cols-[auto_1fr_auto]"
							style="height: 32px;"
						>
							<div class="input-group-shim">€</div>
							<input type="number" class="pt-1" name="amount" placeholder="Cantidad" step="0.01" />
						</div>
					</form>
				{/if}
				<a
					class="variant-filled-success btn btn-sm w-full"
					target="_blank"
					href={CustomerUtilites.getWhatsappLink(
						data.order.customer,
						OrderUtilites.getWhatsappTicketText(data.order)
					)}
					><Icon class="mr-1" data={faWhatsapp} /> Enviar resguardo a cliente
				</a>

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

				{#if data.order.status === OrderStatus.FINISHED}
					<a
						class="variant-filled-success btn btn-sm w-full"
						target="_blank"
						aria-disabled="true"
						href={CustomerUtilites.getWhatsappLink(
							data.order.customer,
							OrderUtilites.getWhatsappFinishedText([data.order])
						)}
					>
						<Icon class="mr-1" data={faWhatsapp} /> Enviar mensaje finalizado
					</a>
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
					href="/customers/{data.order.customer.id}"
					><Icon class="mr-1" data={faUser} />Ver cliente</a
				>
				<button
					class="variant-filled btn btn-sm w-full"
					on:click={() => {
						goto(`/orders/${data?.order?.id}/day`);
					}}
					><Icon class="mr-1" data={faBox} /> Pedidos del día
				</button>
			</div>
		{/if}

		{#if formLoading}
			<ProgressBar text={'Aplicando cambios...'} />
		{/if}

		<div class="flex w-full flex-col gap-1">
			<div class="flex w-full flex-col gap-1">
				<hr class="mb-3 mt-2 border-t border-gray-200 lg:col-span-2" />
				<button
					class="btn btn-sm w-full bg-[#f77f00] text-lg text-white hover:bg-[#d16b00] focus:outline-none focus:ring-2 focus:ring-[#f77f00] focus:ring-offset-2"
					on:click={() => {
						goto(`/orders/${data?.order?.id}/files`);
					}}
					><Icon class="mr-1" data={faCamera} /> Cámara
				</button>
			</div>
			{#if data.calculatedItem}
				<div class="flex w-full flex-col gap-1">
					<hr class="mb-3 mt-2 border-t border-gray-200 lg:col-span-2" />
					<span class="variant-ghost badge text-lg">Total {totalOrder.toFixed(2)} €</span>
					{#if data.order.amountPayed === 0}
						<span class="variant-ghost-warning badge text-lg"> No pagado </span>
					{:else if data.order.amountPayed === totalOrder}
						<span class="variant-ghost-success badge text-lg"> Pagado </span>
					{:else}
						<span class="variant-ghost-secondary badge text-lg">
							{data.order.amountPayed.toFixed(2)}€ pagado - {(
								totalOrder - data.order.amountPayed
							).toFixed(2)}€ pendiente
						</span>
					{/if}
					<span
						class="badge text-lg"
						class:variant-ghost={OrderStatus.PENDING === data.order.status}
						class:variant-ghost-primary={OrderStatus.FINISHED === data.order.status}
						class:variant-ghost-tertiary={OrderStatus.PICKED_UP === data.order.status}
					>
						{orderStatusMap[data.order.status] +
							' - ' +
							DateTime.fromJSDate(data.order.statusUpdated).toFormat('dd/MM/yyyy HH:mm')}
					</span>
				</div>
			{/if}

			<Spacer title={`Datos del pedido ${data.order.hasArrow ? '⬇︎' : ''}`} />

			<span class="text-md text-gray-700"
				><span class="font-semibold">Dependiente:</span> {data.order.user.name}</span
			>
			<span class="text-md text-gray-700">
				<span class="font-semibold">Fecha y hora:</span>
				{DateTime.fromJSDate(data.order.createdAt).toFormat('dd/MM/yyyy HH:mm')}
			</span>
			<span class="text-md text-gray-700">
				<span class="font-semibold">Fecha de recogida:</span>
				{DateTime.fromJSDate(data.order.item.deliveryDate).toFormat('dd/MM/yyyy')}
			</span>
			<span class="text-md text-gray-700">
				<span class="font-semibold">Medidas de la obra:</span>
				{`${data.order.item.height}x${data.order.item.width} cm`}
			</span>
			<span class="text-md text-gray-700">
				<span class="font-semibold">Medidas de trabajo:</span>
				{OrderUtilites.getWorkingDimensions(data.order)}
			</span>
			{#if data.order.item.exteriorHeight || data.order.item.exteriorWidth}
				<span class="text-md text-gray-700">
					<span class="font-semibold">Medidas exteriores del marco:</span>
					{`${data.order.item.exteriorHeight}x${data.order.item.exteriorWidth} cm`}
				</span>
			{/if}
			<span class="text-md text-gray-700">
				<span class="font-semibold">Descripción:</span>
				{data.order.item.description}
			</span>
			<span class="text-md text-gray-700">
				<span class="font-semibold">Observaciones:</span>
				{data.order.item.observations}
			</span>
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
				{#if data.calculatedItem.quantity > 1}
					<span class="text-md text-gray-700"
						>Unidades: <span class="variant-ghost badge">{data.order.item.quantity}</span>
					</span>
					<span class="text-md text-gray-700">
						Precio unitario: <span class="variant-ghost badge">
							{CalculatedItemUtilities.getUnitPriceWithoutDiscount(data.calculatedItem)} €
						</span>
					</span>
					{#if data.calculatedItem.discount > 0}
						<span class="text-md text-gray-700">
							Precio unitario con descuento: <span class="variant-ghost badge">
								{CalculatedItemUtilities.getUnitPriceWithDiscount(data.calculatedItem)} €</span
							>
						</span>
					{/if}
				{/if}
				{#if data.calculatedItem.discount > 0}
					<span class="variant-ghost badge"
						>Total sin descuento {CalculatedItemUtilities.getTotalWithoutDiscount(
							data.calculatedItem
						).toFixed(2)} €</span
					>
					<span class="variant-ghost badge"> Descuento {data.calculatedItem.discount}% </span>
				{/if}
			{/if}

			<form
				class="w-full pt-4"
				method="post"
				action="?/deleteOrder"
				use:enhance={({ cancel }) => {
					if (!confirm('Estás seguro que quieres eliminar el pedido?')) {
						cancel();
						return;
					}

					formLoading = true;
					return async ({ update }) => {
						await update();
						formLoading = false;
					};
				}}
			>
				<button class="variant-filled-error btn btn-sm w-full">
					<Icon class="mr-1" data={trash} /> Eliminar pedido</button
				>
			</form>
		</div>
	{/if}
</div>
