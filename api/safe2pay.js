import safe2pay from 'safe2pay';
import { SAFE2PAY_TOKEN } from './config.js';

safe2pay.environment.setApiKey(SAFE2PAY_TOKEN);

export default safe2pay; 