<script lang="ts">
	import { Icon } from 'svelte-awesome';
	import trash from 'svelte-awesome/icons/trash';
	import close from 'svelte-awesome/icons/close';
	import { faArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft';
	import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight';

	export let imageUrl = '';
	export let id = '';
	export let visible = false;
	export let onClose = () => {};
	export let onDelete = async (id: string) => {};
	export let onNext = (id: string) => {};
	export let onPrevious = (id: string) => {};

	async function handleDelete() {
		await onDelete(id);
	}

	function handleNext() {
		onNext(id);
	}

	function handlePrevious() {
		onPrevious(id);
	}
</script>

{#if visible}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
		on:click={onClose}
	>
		<div class="absolute right-4 top-4 flex space-x-2">
			<button
				class="flex items-center justify-center rounded-full bg-red-600 p-3 text-white shadow-lg hover:bg-red-700 focus:outline-none"
				on:click|stopPropagation={handleDelete}
			>
				<Icon class="mr-1" data={trash} /> Eliminar
			</button>
			<button
				class="flex items-center justify-center rounded-full bg-gray-600 p-3 text-white shadow-lg hover:bg-gray-700 focus:outline-none"
				on:click|stopPropagation={onClose}
			>
				<Icon class="mr-1" data={close} /> Cerrar
			</button>
		</div>
		<button
			class="absolute left-4 top-1/2 flex -translate-y-1/2 transform items-center justify-center rounded-full bg-blue-600 p-3 text-white shadow-lg hover:bg-blue-700 focus:outline-none"
			on:click|stopPropagation={handlePrevious}
		>
			<Icon class="text-3xl" data={faArrowLeft} />
		</button>
		<button
			class="absolute right-4 top-1/2 flex -translate-y-1/2 transform items-center justify-center rounded-full bg-blue-600 p-3 text-white shadow-lg hover:bg-blue-700 focus:outline-none"
			on:click|stopPropagation={handleNext}
		>
			<Icon class="text-3xl" data={faArrowRight} />
		</button>
		<img
			src={imageUrl}
			alt="Overlay Image"
			class="max-h-full max-w-full object-contain shadow-lg"
			on:click|stopPropagation
		/>
	</div>
{/if}
