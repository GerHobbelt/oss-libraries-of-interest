<?php
/**
 * Created by PhpStorm.
 * User: ykmship
 * Date: 28/08/14
 * Time: 23:42
 */

namespace Kozz\Components\DataMerge\Handler;


use Kozz\Components\DataMerge\Handler\Config\BaseEntryConfig;
use Kozz\Components\DataMerge\Handler\Dependency\AuthorIdDependency;

class BaseEntryHandler extends AbstractHandler
{

  /**
   * @var BaseEntryConfig
   */
  protected $config;

  public function handle()
  {
    if(!$this->authorCheck())
    {
      return true;
    }

    $shadow = $this->data->getMergeWith();

    foreach($this->config->getExcludePaths() as $path)
    {
      $closure  = $path->getRetrieveClosure();
      $pathData = $closure($this->data->getSource());
      $closure  = $path->getApplyClosure();
      $closure($shadow, $pathData);
    }

    $this->data->setSource($shadow);
  }

  protected function authorCheck()
  {
    $dependency = $this->dependencies->get(new AuthorIdDependency());
    if($dependency instanceof AuthorIdDependency)
    {
      $authorId = $dependency->getAuthorId();
      $closure  = $dependency->getAuthorIdClosure();

      $authorId1 = $closure($this->data->getSource());
      $authorId2 = $closure($this->data->getMergeWith());
      if($authorId1 != $authorId2)
      {
        throw new \DomainException(
          "Integrity check fails: merging data has different architects"
        );
      }

      return $authorId == $authorId1;
    }
    return true;
  }
}