<?php
/**
 * @author Yury Kozyrev <ykmship@yandex-team.ru>
 */

namespace Kozz\Components\ArrayUpdater;

use CallbackFilterIterator;
use Kozz\Helper\ArrayHelper\ArrayPathHelper;
use PhpOption\None;
use RecursiveArrayIterator;
use RecursiveIteratorIterator;

/**
 * Class ArrayUpdater
 *
 * @package Kozz\Components\ArrayUpdater
 */
class ArrayUpdater
{

  /**
   * @var array
   */
  protected $data = [];

  /**
   * @var array
   */
  protected $path = [];

  /**
   * @var array
   */
  protected $pathFiltered = [];

  /**
   * @var
   */
  protected $count;

  /**
   * @param array $data
   */
  public function __construct(array $data)
  {
    $this->data = $data;
  }

  /**
   * @param array $data
   *
   * @return ArrayUpdater
   */
  public static function from(array $data)
  {
    return new self($data);
  }

  /**
   * @param $name
   *
   * @return $this
   */
  public function node($name)
  {
    $this->path[] = $name;
    $this->clearTmpVars();
    return $this;
  }

  /**
   * @return $this
   */
  public function all()
  {
    return $this->node(None::create());
  }

  /**
   * @param $search
   * @param $replace
   *
   * @return array
   */
  public function replace($search, $replace)
  {
    return $this->replaceAssoc([$search, $replace]);
  }

  /**
   * @param array $association
   *
   * @return array
   */
  public function replaceAssoc(array $association)
  {
    $iterator = new RecursiveIteratorIterator(new RecursiveArrayIterator($this->data));
    $it       = new CallbackFilterIterator($iterator, $this->getClosure($association));

    iterator_to_array($it);
    return $this->data;
  }


  /**
   * @return int
   */
  protected function countNodes()
  {
    if(!$this->count)
    {
      $this->count = count($this->path);
    }
    return $this->count;
  }

  /**
   * @return array
   */
  protected function getFilteredPath()
  {
    if(!$this->pathFiltered)
    {
      $this->pathFiltered = array_filter($this->path, function($value){
        return !$value instanceof None;
      });
    }
    return $this->pathFiltered;
  }

  /**
   * @param array $association
   *
   * @return callable
   */
  protected function getClosure(array $association)
  {
    return function ($current, $key, RecursiveIteratorIterator $iterator) use ($association)
    {
      if ($this->isLooksCorrect($iterator, $association, $current))
      {
        $currentPath = ArrayPathHelper::getPath($iterator);

        if($this->isPathMatch($currentPath))
        {
          ArrayPathHelper::pathSet($this->data, $currentPath, $association[$current]);
        }
      }
    };
  }

  /**
   * @param RecursiveIteratorIterator $iterator
   * @param array                     $association
   * @param                           $current
   *
   * @return bool
   */
  protected function isLooksCorrect(RecursiveIteratorIterator $iterator, array $association, $current)
  {
    return $iterator->getDepth() + 1 === $this->countNodes() && isset($association[$current]);
  }

  /**
   * @param array $currentPath
   *
   * @return bool
   */
  protected function isPathMatch(array $currentPath)
  {
    $filter = $this->getFilteredPath();
    $diff   = array_diff_assoc($currentPath, $filter);
    $keys   = array_intersect_key($filter, $diff);
    return empty($keys);
  }

  /**
   * @return void
   */
  protected function clearTmpVars()
  {
    $this->count = [];
    $this->pathFiltered = [];
  }
}