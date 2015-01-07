<?php
/**
 * @author Yury Kozyrev <ykmship@yandex-team.ru>
 */

namespace Kozz\Components\DataMerge;


use Kozz\Components\Closure\AbstractClosureConstructor;

class DataContainer extends AbstractClosureConstructor
{
  /**
   * @var mixed
   */
  protected $source;

  /**
   * @var mixed
   */
  protected $mergeWith;

  /**
   * @param mixed $mergeWith
   */
  public function setMergeWith($mergeWith)
  {
    $this->mergeWith = $mergeWith;
  }

  /**
   * @return mixed
   */
  public function getMergeWith()
  {
    return $this->mergeWith;
  }

  /**
   * @param mixed $source
   */
  public function setSource($source)
  {
    $this->source = $source;
  }

  /**
   * @return mixed
   */
  public function getSource()
  {
    return $this->source;
  }


} 