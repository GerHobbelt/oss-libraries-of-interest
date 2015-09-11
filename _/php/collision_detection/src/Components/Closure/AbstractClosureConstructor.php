<?php
/**
 * @author Yury Kozyrev <ykmship@yandex-team.ru>
 */

namespace Kozz\Components\Closure;


use Closure;

/**
 * Class AbstractClosureConstructor
 *
 * @package Kozz\Components\Closure
 */
abstract class AbstractClosureConstructor
{

  /**
   * @param callable $closure
   */
  public function __construct(Closure $closure = null)
  {
    if($closure)
    {
      $this->checkClosure($closure);
      $closure($this);
    }
  }

  /**
   * @param callable $closure
   *
   * @throws \InvalidArgumentException
   */
  protected function checkClosure(Closure $closure)
  {
    $reflection = new \ReflectionFunction($closure);
    $parameters = $reflection->getParameters();
    if(!$parameters)
    {
      throw new \InvalidArgumentException("Constructor Closure should have one parameter");
    }

    $selfReflection = new \ReflectionClass($this);

    if($parameters[0]->getClass()->getName() !== $selfReflection->getName())
    {
      throw new \InvalidArgumentException(
        sprintf("You should declare Constructor Closure parameter as instance of %s [e.g.: function(%s \$class){ ... } ]",
          $selfReflection->getShortName(),
          $selfReflection->getShortName()
        )
      );
    }
  }

} 