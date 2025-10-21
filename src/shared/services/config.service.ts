import { Injectable } from '@nestjs/common';
import { ConfigService as Service } from '@nestjs/config';
import { Configuration } from '../config';

@Injectable()
export class ConfigService {
  constructor(private readonly configService: Service<Configuration>) {}

  get<K extends keyof Configuration>(key: K): Configuration[K] {
    return this.configService.get<Configuration[K]>(key)!;
  }

  getDatabaseConfig(): Configuration['database'] {
    return this.get('database');
  }
}
