import { ContractsActions, IContractsAction } from './actions';

export interface IContractsState {
    marketContractLookupAddress: string;
    currencies: string[];
}

const defaultState: IContractsState = {
    marketContractLookupAddress: '',
    currencies: []
};

export default function reducer(state = defaultState, action: IContractsAction): IContractsState {
    switch (action.type) {
        case ContractsActions.setMarketContractLookupAddress:
            return { ...state, marketContractLookupAddress: action.payload.address };

        case ContractsActions.setCurrencies:
            return { ...state, currencies: action.payload.currencies };

        default:
            return state;
    }
}
