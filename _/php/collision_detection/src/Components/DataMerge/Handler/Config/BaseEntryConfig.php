<?php
/**
 * @author Yury Kozyrev <ykmship@yandex-team.ru>
 */

namespace Kozz\Components\DataMerge\Handler\Config;

use Closure;
use SplObjectStorage;
use Kozz\Components\DataMerge\Handler\Config\BaseEntryConfig\ExcludePath;

class BaseEntryConfig extends AbstractConfig
{

  /**
   * @var ExcludePath[]
   */
  protected $excludePaths;

  /**
   * @param Closure $closure
   */
  public function __construct(Closure $closure = null)
  {
    $this->excludePaths = new SplObjectStorage();
    parent::__construct($closure);
  }

  /**
   * @param ExcludePath $path
   */
  public function addExcludePath(ExcludePath $path)
  {
    $this->excludePaths->attach($path);
  }

  /**
   * @return ExcludePath[]
   */
  public function getExcludePaths()
  {
    return $this->excludePaths;
  }

}