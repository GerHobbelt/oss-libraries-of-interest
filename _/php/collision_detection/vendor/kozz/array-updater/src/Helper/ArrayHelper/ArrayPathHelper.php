<?php
/**
 * @author Yury Kozyrev <ykmship@yandex-team.ru>
 */

namespace Kozz\Helper\ArrayHelper;

use RecursiveIteratorIterator;

/**
 * Class ArrayPathHelper
 *
 * @package Kozz\Helper\ArrayHelper
 */
class ArrayPathHelper
{

  /**
   * @param       $array
   * @param array $path
   * @param       $value
   */
  public static function pathSet(array &$array, array $path, $value)
  {
    $cur =& $array;
    foreach ($path as $segment)
    {
      if (!isset($cur[$segment]))
      {
        $cur[$segment] = [];
      }

      $cur =& $cur[$segment];
    }
    $cur = $value;
    unset($cur);
  }

  /**
   * @param RecursiveIteratorIterator $iterator
   *
   * @return array Path
   */
  public static function getPath(RecursiveIteratorIterator $iterator)
  {
    $path = [];
    for ($i = 0; $i <= $iterator->getDepth(); $i++)
    {
      $path[] = $iterator->getSubIterator($i)->key();
    }
    return $path;
  }
} 