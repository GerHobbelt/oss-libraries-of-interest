<?php
/**
 * @author Yury Kozyrev <ykmship@yandex-team.ru>
 */

namespace Kozz\Helper\Closure;


use Closure;

class ClosureHelper
{
  /**
   * @param Closure $closure
   * @param         $from
   * @param null    $default
   *
   * @return mixed
   */
  public static function getFromClosure(Closure $closure = null, $from, $default = null)
  {
    return ($closure instanceof Closure)
      ? $closure($from)
      : $default;
  }
} 