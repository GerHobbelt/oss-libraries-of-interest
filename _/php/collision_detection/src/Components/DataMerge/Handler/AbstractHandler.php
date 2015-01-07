<?php
/**
 * @author Yury Kozyrev <ykmship@yandex-team.ru>
 */

namespace Kozz\Components\DataMerge\Handler;

use Closure;
use Kozz\Components\Closure\AbstractClosureConstructor;
use Kozz\Components\DataMerge\DataContainer;
use Kozz\Components\DataMerge\Handler\Config\AbstractConfig;
use Kozz\Components\DataMerge\Handler\Dependency\AbstractDependency;
use Kozz\Components\DataMerge\Handler\Dependency\DependencyManager;

abstract class AbstractHandler extends AbstractClosureConstructor
{
  /**
   * @var DataContainer
   */
  protected $data;

  /**
   * @var AbstractConfig
   */
  protected $config;

  /**
   * @var DependencyManager
   */
  protected $dependencies;

  abstract public function handle();

  /**
   * @param AbstractConfig $config
   * @param callable       $closure
   */
  public function __construct(AbstractConfig $config = null, Closure $closure = null)
  {
    $this->setConfig($config);
    $this->dependencies = new DependencyManager();
    parent::__construct($closure);
  }

  /**
   * @param DataContainer $data
   */
  public function setData(DataContainer $data)
  {
    $this->data = $data;
  }

  /**
   * @param AbstractConfig $config
   */
  public function setConfig(AbstractConfig $config = null)
  {
    $this->config = $config;
  }

  /**
   * @param AbstractDependency $dependency
   */
  public function addDependency(AbstractDependency $dependency)
  {
    $this->dependencies->add($dependency);
  }
} 