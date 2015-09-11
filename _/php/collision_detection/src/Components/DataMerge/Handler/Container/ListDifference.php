<?php
/**
 * @author Yury Kozyrev <ykmship@yandex-team.ru>
 */

namespace Kozz\Components\DataMerge\Handler\Container;


class ListDifference
{
  protected $deleteFromSource = [];
  protected $insertFromNew = [];
  protected $appendFromNew = [];

  /**
   * @param array $deleteFromSource
   */
  public function setDeleteFromSource($deleteFromSource)
  {
    $this->deleteFromSource = $deleteFromSource;
  }

  /**
   * @return array
   */
  public function getDeleteFromSource()
  {
    $return = $this->deleteFromSource;
    ksort($return);
    return $return;
  }

  /**
   * @param array $insertFromNew
   */
  public function setInsertFromNew($insertFromNew)
  {
    $this->insertFromNew = $insertFromNew;
  }

  /**
   * @return array
   */
  public function getInsertFromNew()
  {
    $return = $this->insertFromNew;
    uasort($return, 'strnatcmp');
    return $return;
  }

  /**
   * @param array $appendFromNew
   */
  public function setAppendFromNew($appendFromNew)
  {
    $this->appendFromNew = $appendFromNew;
  }

  /**
   * @return array
   */
  public function getAppendFromNew()
  {
    return $this->appendFromNew;
  }






} 