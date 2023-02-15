/**
 * 管道操作的定义
 */
type PipeOperation<Input=any, Output=any> = (x: Input, ...otherArgs: any[]) => Output

/**
 * 管道的重载
 * @param initialValue 初始值
 * @param op1 管道操作
 */
function pipeline<A, B> (initialValue: A, op1: PipeOperation<A, B>): B
function pipeline<A, B, C> (initialValue: A,
  op1: PipeOperation<A, B>,
  op2: PipeOperation<B, C>
): C
function pipeline<A, B, C, D> (initialValue: A,
  op1: PipeOperation<A, B>,
  op2: PipeOperation<B, C>,
  op3: PipeOperation<C, D>
): D
function pipeline<A, B, C, D, E> (initialValue: A,
  op1: PipeOperation<A, B>,
  op2: PipeOperation<B, C>,
  op3: PipeOperation<C, D>,
  op4: PipeOperation<D, E>
): E

function pipeline<A, B, C, D, E, F> (initialValue: A,
  op1: PipeOperation<A, B>,
  op2: PipeOperation<B, C>,
  op3: PipeOperation<C, D>,
  op4: PipeOperation<D, E>,
  op5: PipeOperation<E, F>
): F

function pipeline<A, B, C, D, E, F, G> (initialValue: A,
  op1: PipeOperation<A, B>,
  op2: PipeOperation<B, C>,
  op3: PipeOperation<C, D>,
  op4: PipeOperation<D, E>,
  op5: PipeOperation<E, F>,
  op6: PipeOperation<F, G>,
): G

function pipeline <Input=any, Output=any> (initialValue: Input, ...operations: PipeOperation[]): Output {
  const result = operations.reduce((pre, cur) => cur(pre), initialValue) as unknown as Output
  return result
}

export default pipeline
