//global
import { snakeCase, get, set, map, pickBy } from 'lodash';
import { singularize } from 'inflection';

//app
import * as models from 'src/models';

//internal
import { truncDateString } from '../utils/strings';

/*
 const getFieldName = (fieldPath) => {  //tomixins
 const match = fieldPath.match(/(.*)\[(\d*)\]\.([0-9A-Za-z]+)$/);
 if (match) {
 const modelName = singularize(match[1].split('.').pop());
 return `${modelName}.${match[3]}`;
 }
 return fieldPath.split('.').slice(-2).join('.');
 }
 */
export default {

  computed: {
    /*
     modelObj() {
     return this.model ? models[this.model] : {};
     },*/
    fieldObj() {
      console.log('COMPUTED fieldObj', this.form.field);
      if (!this.form.field) {
        return {};
      }

      const splittedField = this.form.field.split('.').reverse();
      const fieldName = splittedField.shift();
      const model = models[singularize(splittedField.shift() || '')];
      return this.getFieldObj(fieldName, model);
    }, /*
     fieldOptions() {
     return this.model ? this.getFieldOptions() : {};
     }*/
  },

  methods: {
    /*
     getDictValue(key, dict, language = 'UK') {
     const v = this.$store.getters.DICT(`${dict}&language=${language}`).find(v => v.key === key);
     return v ? v.value : key;
     },
     getModelObj(modelName) {
     return models[modelName];
     },
     getFieldObj(field, modelObj = this.modelObj) {
     return modelObj.fields[field] || {};
     },
     getFieldValue(fieldPath) {
     const currentValue = get(this, fieldPath);
     if (currentValue === null || currentValue === undefined) {
     return null;
     }
     const fieldArr = getFieldName(fieldPath).split('.');
     const modelName = fieldArr[0];
     const fieldName = fieldArr[1];
     const field = this.getFieldObj(fieldName, this.getModelObj(modelName));
     return this.formatValue(field, currentValue);
     },
     formatValue(field, value) {
     if (field.type && typeof field.type === 'string' && field.type !== 'model') {
     switch (field.type) {
     case 'select':
     return field.multiple ? value.map(v => this.getDictValue(v, field.dict)).join(', ') : this.getDictValue(value, field.dict);
     case 'date':
     return field.multiple ? value.map(v => truncDateString(v)).join(', ') : truncDateString(value);
     case 'boolean':
     return field.multiple ? value.map(v => this.getDictValue(v ? '1' : '0', 'BOOL')).join(', ') : this.getDictValue(value ? '1' : '0', 'BOOL');
     default:
     return field.multiple ? value.join(', ') : value;
     }
     }
     return value;
     },

     getModelValue(modelName, modelValue, filter = () => true) {

     const modelObj = this.getModelObj(modelName);
     let formatModelValue = {name: modelObj.name, fields: []};

     for (const key in modelValue) {

     const field = this.getFieldObj(key, modelObj);
     if (field.type && typeof field.type === 'string' && field.export !== false && modelValue[key] !== null && modelValue[key] !== undefined && filter(key, field)) {
     if (field.type !== 'model') {
     formatModelValue.fields.push({label: field.label, value: this.formatValue(field, modelValue[key])});
     } else {
     if (field.relation === 'hasOne' && typeof modelValue[key] === 'object' && Object.keys(modelValue[key]).length) {
     const modelObj = this.getModelObj(key);
     formatModelValue.fields.push({model: key, label: modelObj.name, values: [{
     value: modelObj.displayedValue ? modelObj.displayedValue.call(this, modelValue[key]) : modelObj.name,
     modelValue: modelValue[key]
     }]});
     } else if (field.relation === 'hasMany' && Array.isArray(modelValue[key]) && modelValue[key].length) {
     const singularizeModelName = singularize(key);
     const modelObj = this.getModelObj(singularizeModelName);
     formatModelValue.fields.push({model: singularizeModelName, label: modelObj.name, values: modelValue[key].map(value => ({
     value: modelObj.displayedValue ? modelObj.displayedValue.call(this, value) : modelObj.name,
     modelValue: value
     }))});
     }
     }
     }
     }
     return formatModelValue;
     },
     /*getFieldOptionsRecursive(filter) {
     let options = [];
     const iterator = (obj, prevKey) => {
     Object.keys(obj).forEach(key => {
     const value = obj[key];
     const label = value.label;
     const newKey = prevKey ? `${prevKey}.${key}` : key;
     const newLabel = prevKey ? `${prevKey}.${label}` : label;
     if (value.type && typeof value.type === 'string' && filter(value)) {
     return options.push({value: newLabel, key: newKey, stamp: newKey});
     }
     return iterator(value, newKey);
     });
     }
     iterator(this.modelObj);
     return options;
     },

     getFieldOptions(filter = () => true, modelObj = this.modelObj) {
     let options = [];
     for (const key in modelObj.fields) {
     const field = modelObj.fields[key];
     if (field.type && typeof field.type === 'string' && field.type !== 'model' && filter(field)) {
     options.push({value: field.label, key, stamp: snakeCase(key)});
     }
     }
     return options;
     },
     */
    getFieldOptions(customFilter = () => true, model = this.model) {
      return map(
          pickBy(model.fields(), field => field.filter !== false && field.type !== 'model' && customFilter(field)),
          (field, key) => ({value: field.label, key, stamp: snakeCase(key)}))
    }
  }
}
