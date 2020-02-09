export const orderOptions = [
    {
        key: 'asc',
        stamp: 'ASC',
        value: 'за зростанням'
    }, {
        key: 'desc',
        stamp: 'DESC',
        value: 'по спадінню'
    }
];

export const whereOptions = [
    {
        stamp: '=',
        key: 'eq',
        value: 'дорівнює'
    }, {
        stamp: '<>',
        key: 'neq',
        value: 'не дорівнює'

    }, {
        stamp: '>',
        key: 'gt',
        value: 'більше'
    }, {
        stamp: '>=',
        key: 'gte',
        value: 'більше або дорівнює'
    }, {
        stamp: '<',
        key: 'lt',
        value: 'менше'
    }, {
        stamp: '<=',
        key: 'lte',
        value: 'менше або дорівнює'
    }, {
        stamp: 'LIKE',
        key: 'like',
        value: 'подібно'
    }, {
        stamp: 'NOT LIKE',
        key: 'nlike',
        value: 'не подібно'
    }, {
        stamp: 'BETWEEN',
        key: 'between',
        value: 'між'
    }, {
        stamp: 'NOT BETWEEN',
        key: 'nbetween',
        value: 'не між'
    }, {
        stamp: 'IN',
        key: 'inq',
        value: 'міститься у'
    }, {
        stamp: 'NOT IN',
        key: 'nin',
        value: 'не міститься у'
    }, {
        stamp: 'REGEXP_LIKE',
        key: 'regexp',
        value: 'в шаблоні'
    }, {
        stamp: 'IS NULL',
        key: 'null',
        value: 'порожньо'
    }, {
        stamp: 'IS NOT NULL',
        key: 'nnull',
        value: 'не порожньо'
    }
];

export const multipleWhereOptions = [
    {
        stamp: '=',
        key: '$eq',
        value: 'дорівнює'
    }, {
        stamp: '<>',
        key: '$neq',
        value: 'не дорівнює'

    }, {
        stamp: 'IN',
        key: '$inq',
        value: 'міститься у'
    }, {
        stamp: 'NOT IN',
        key: '$nin',
        value: 'не міститься у'
    }, {
        stamp: 'CONTAINS',
        key: '$contains',
        value: 'містить'
    }, {
        stamp: 'NOT CONTAINS',
        key: '$ncontains',
        value: 'не містить'
    }, {
        stamp: 'CONTAINS LIKE',
        key: '$contlike',
        value: 'містить подобно'
    }, {
        stamp: 'NOT CONTAINS LIKE',
        key: '$ncontlike',
        value: 'не містить подібно'
    }, {
        stamp: 'REGEXP_LIKE',
        key: 'regexp',
        value: 'в шаблоні'
    }, {
        stamp: 'CONTAINS NULL',
        key: '$null',
        value: 'порожньо'
    }, {
        stamp: 'NOT CONTAINS NULL',
        key: '$nnull',
        value: 'не порожньо'
    }
]
