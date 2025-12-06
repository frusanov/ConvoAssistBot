export type WithMeta<D = unknown, M = {}> = {
  data: D;
  meta?: M;
};

export type WithPagination<D extends { id: string } = { id: string }> =
  WithMeta<
    Array<D>,
    {
      limit: number;
      offset: number;
    }
  >;
