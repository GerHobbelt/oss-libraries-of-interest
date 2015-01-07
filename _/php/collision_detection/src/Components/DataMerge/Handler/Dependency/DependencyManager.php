<?php
/**
 * @author Yury Kozyrev <ykmship@yandex-team.ru>
 */

namespace Kozz\Components\DataMerge\Handler\Dependency;

class DependencyManager
{

  /**
   * @var AbstractDependency[]
   */
  protected $instanceSet = [];

  /**
   * @param AbstractDependency $dependency
   *
   * @throws \InvalidArgumentException
   */
  public function add(AbstractDependency $dependency)
  {
    $instanceClass = get_class($dependency);
    if (isset($this->instanceSet[$instanceClass]))
    {
      throw new \InvalidArgumentException(sprintf("%s dependency already exists in set", $instanceClass));
    }
    $this->instanceSet[$instanceClass] = $dependency;
  }

  /**
   * @param AbstractDependency $dependency
   *
   * @return AbstractDependency | null
   * @throws \InvalidArgumentException
   */
  public function get(AbstractDependency $dependency)
  {
    $instanceClass = get_class($dependency);
    if (!isset($this->instanceSet[$instanceClass]))
    {
      return null;
    }

    return $this->instanceSet[$instanceClass];
  }
} 