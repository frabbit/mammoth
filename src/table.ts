import { Column, ColumnDefinition } from './column';
import { toSnakeCase, wrapQuotes } from './naming/snake-case';

export class TableDefinition<Columns> {
  private _tableDefinitionBrand: any;
}

export type Table<TableName, Columns> = Columns & InternalTable<TableName, Columns>;

interface InternalTable<TableName, Columns> {
  /** @internal */
  getName(): string;

  /** @internal */
  getOriginalName(): string;

  // Because we use the column's table name to determine whether the data type should be nullable
  // when joining, we change the column's table name to the alias.
  as<T>(
    alias: T,
  ): Table<
    T,
    {
      [K in keyof Columns]: Columns[K] extends Column<
        infer Name,
        string,
        infer DataType,
        infer IsNotNull,
        infer HasDefault,
        infer JoinType
      >
        ? Column<Name, T, DataType, IsNotNull, HasDefault, JoinType>
        : never;
    }
  >;
}

export const makeTable = <
  TableName extends string,
  TableDefinition extends { [column: string]: ColumnDefinition<any, any, any> }
>(
  tableName: TableName,
  originalTableName: string | undefined,
  tableDefinition: TableDefinition,
) => {
  const columnNames = Object.keys(
    (tableDefinition as unknown) as object,
  ) as (keyof TableDefinition)[];

  const columns = columnNames.reduce(
    (map, columnName) => {
      const column = new Column(columnName as string, wrapQuotes(tableName), undefined) as any;
      map[columnName] = column;
      return map;
    },
    {} as Table<
      TableName,
      {
        [K in keyof TableDefinition]: K extends string
          ? Column<
              K,
              TableName,
              TableDefinition[K] extends ColumnDefinition<infer DataType, any, any>
                ? DataType
                : never,
              TableDefinition[K] extends ColumnDefinition<any, infer IsNotNull, any>
                ? IsNotNull
                : never,
              TableDefinition[K] extends ColumnDefinition<any, any, infer HasDefault>
                ? HasDefault
                : never,
              undefined
            >
          : never;
      }
    >,
  );

  const table = {
    ...columns,
    as<T extends string>(alias: T) {
      return makeTable(alias, tableName, tableDefinition) as any;
    },
    getName() {
      return tableName;
    },
    getOriginalName() {
      return originalTableName;
    },
  };
  return table;
};

export const defineTable = <Columns extends { [column: string]: ColumnDefinition<any, any, any> }>(
  tableDefinition: Columns,
): TableDefinition<Columns> => {
  return tableDefinition as any;
};
