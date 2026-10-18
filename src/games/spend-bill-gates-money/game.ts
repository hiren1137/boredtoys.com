import { mountSpend } from '../_spend/engine';
import data from '../../data/spend/spend-bill-gates-money';

export function mount(root: HTMLElement): void {
  mountSpend(root, data);
}
