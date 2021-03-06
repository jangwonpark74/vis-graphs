import { GridDataAutoCompleteHandler } from 'react-filter-box';
import _ from 'lodash';

export default class AutoCompleteHandler extends GridDataAutoCompleteHandler {
    constructor(data, options, scroll = false) {
        super(data, options);
        this.scroll = scroll;
    }
    needOperators(parsedCategory) {
        const result = super.needOperators(parsedCategory);
        return this.scroll ? ["==", "!="] : result.concat(["startsWith"]);
    }

    needValues(parsedCategory, parsedOperator) {
        const found = _.find(this.options, f => f.columField === parsedCategory || f.columnText === parsedCategory);

        if (found === null) {
            return [];
        }
        const parsedField = found.columField;

        if (found.type === "selection" && this.data !== null) {
            if (!this.cache[parsedField]) {
                this.cache[parsedField] = _.chain(this.data).map(f => f[parsedField]).uniq().value();
            }
            return this.cache[parsedField];
        }

        if (found.customValuesFunc) {
            return found.customValuesFunc(parsedField, parsedOperator);
        }

        return [];
    }
}