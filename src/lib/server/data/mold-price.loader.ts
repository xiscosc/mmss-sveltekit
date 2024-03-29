import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import * as stream from 'stream';
import { read } from 'xlsx';
import * as log from 'lambda-log';

import { env } from '../config/env';
import type { ListPriceDto } from '../repository/dto/list-price.dto';
import { ListPricingRepository } from '../repository/list-pricing.repository';
import { PricingFormula, PricingType } from '../../type/pricing.type';

export class MoldPriceLoader {
	private repository: ListPricingRepository;
	private s3Client: S3Client;
	constructor() {
		this.repository = new ListPricingRepository();
		this.s3Client = new S3Client({});
	}

	public async loadMoldPrices(fileName: string): Promise<void> {
		const [currentPrices, newPrices] = await Promise.all([
			this.repository.getAllPricesByType(PricingType.MOLD),
			this.getPricesFromExcel(fileName)
		]);
		const toDeleteIds = currentPrices.filter((p) => !newPrices.has(p.id)).map((p) => p.id);
		await Promise.all([
			this.repository.batchStoreListPrices(Array.from(newPrices.values())),
			this.repository.deleteListPrices(PricingType.MOLD, toDeleteIds)
		]);
	}

	private async getPricesFromExcel(fileName: string): Promise<Map<string, ListPriceDto>> {
		const buffer = await this.getExcelFromS3(fileName);
		const file = read(buffer, { type: 'buffer' });
		const sheet = file.Sheets['TODAS'];
		if (sheet == null) throw Error('Sheet not found');

		const end = sheet['!ref']!.split(':')[1];
		const maxrow = parseInt(end!.split(/([A-Z])/)[2]!, 10);

		let count = 2;
		const prices = new Map<string, ListPriceDto>();
		while (count < maxrow) {
			const internalId = sheet[`A${count}`];
			const externalId = sheet[`B${count}`];
			const price = sheet[`H${count}`];

			if (internalId && externalId && price) {
				const id = `${internalId.v}_${externalId.v}`;
				if (Number.isNaN(Number(price.v))) {
					const cleanPrice = price.v.toString().replace(' ', '').replace(',', '.');
					if (!Number.isNaN(Number(cleanPrice))) {
						const calcPrice = Math.ceil(Number(cleanPrice) * 100) / 100;
						prices.set(id, MoldPriceLoader.createPricing(id, calcPrice));
					}
				} else {
					prices.set(id, MoldPriceLoader.createPricing(id, Math.ceil(Number(price.v) * 100) / 100));
				}
			}
			count += 1;
		}

		return prices;
	}

	private static createPricing(id: string, price: number): ListPriceDto {
		return {
			id,
			price,
			description: '',
			type: PricingType.MOLD,
			formula: PricingFormula.NONE,
			areas: []
		};
	}

	private async getExcelFromS3(fileName: string): Promise<Buffer> {
		const params = {
			Bucket: env.moldPricesBucket,
			Key: fileName
		};

		try {
			const { Body } = await this.s3Client.send(new GetObjectCommand(params));
			if (Body instanceof stream.Readable) {
				const chunks: Uint8Array[] = [];
				// eslint-disable-next-line no-restricted-syntax
				for await (const chunk of Body) {
					chunks.push(chunk);
				}
				return Buffer.concat(chunks);
			}

			throw new Error('Failed to retrieve file from S3.');
		} catch (error: unknown) {
			log.error(`Error getting file from S3: ${(error as Error).toString()}`);
			throw error;
		}
	}
}
