<?php
/**
 * @author Yury Kozyrev <ykmship@yandex-team.ru>
 */

namespace Kozz\Components\DataMerge;

use DomainException;
use Iterator;
use PhpOption\None;
use PhpOption\Option;
use SplObjectStorage;
use Kozz\Components\DataMerge\Handler\AbstractHandler;

class DataMerge
{

  /**
   * @var SplObjectStorage | AbstractHandler[]
   */
  protected $handlers;

  /**
   * @var Option
   */
  protected $result;

  /**
   * @var DataContainer
   */
  protected $data;

  /**
   * @param mixed $source
   * @param mixed $mergeWith
   */
  public function __construct($source, $mergeWith)
  {
    $this->data = new DataContainer(function(DataContainer $container) use ($source, $mergeWith){
      $container->setSource($source);
      $container->setMergeWith($mergeWith);
    });

    $this->result = None::create();

    $this->handlers = new SplObjectStorage();
    return $this;
  }

  /**
   * @param AbstractHandler $handler
   */
  public function addHandler(AbstractHandler $handler)
  {
    $handler->setData($this->data);
    $this->handlers->attach($handler);
  }

  public function merge()
  {
    foreach($this->handlers as $handler)
    {
      $handler->handle();
    }
    $this->result = Option::fromValue($this->data->getSource());
    return $this;
  }

  /**
   * @return Iterator
   * @throws DomainException
   */
  public function getResult()
  {
    $e = new DomainException("You should run @method merge() before retrieving result");
    return $this->result->getOrThrow($e);
  }
} 