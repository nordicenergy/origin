import { Certificate } from './pods/certificate/certificate.entity';
import { CertificateModule } from './pods/certificate/certificate.module';
import { BlockchainProperties } from './pods/blockchain/blockchain-properties.entity';
import { BlockchainPropertiesModule } from './pods/blockchain/blockchain-properties.module';

export { AppModule, providers } from './app.module';

export const entities = [Certificate, BlockchainProperties];

export const modules = [CertificateModule, BlockchainPropertiesModule];
