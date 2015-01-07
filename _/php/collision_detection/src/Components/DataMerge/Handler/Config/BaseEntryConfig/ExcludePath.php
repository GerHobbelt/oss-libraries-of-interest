<?php
/**
 * Created by PhpStorm.
 * User: ykmship
 * Date: 28/08/14
 * Time: 23:51
 */

namespace Kozz\Components\DataMerge\Handler\Config\BaseEntryConfig;


use Closure;
use Kozz\Components\Closure\AbstractClosureConstructor;

class ExcludePath extends AbstractClosureConstructor
{
  /**
   * @var Closure
   */
  protected $retrieveClosure;

  /**
   * @var Closure
   */
  protected $applyClosure;

  public function setRetrieveClosure(Closure $closure)
  {
    $this->retrieveClosure = $closure;
  }

  public function setApplyClosure(Closure $closure)
  {
    $this->applyClosure = $closure;
  }

  /**
   * @return Closure
   */
  public function getApplyClosure()
  {
    return $this->applyClosure;
  }

  /**
   * @return Closure
   */
  public function getRetrieveClosure()
  {
    return $this->retrieveClosure;
  }


} 