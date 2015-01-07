<?php
/**
 * @author Yury Kozyrev <ykmship@yandex-team.ru>
 */

namespace Kozz\Components\DataMerge\Handler\Dependency;


use Closure;

class AuthorIdDependency extends AbstractDependency
{
  protected $authorId;
  protected $authorIdClosure;

  public function setAuthorId($id)
  {
    $this->authorId = $id;
  }

  public function getAuthorId()
  {
    return $this->authorId;
  }

  /**
   * @param Closure $authorId
   */
  public function setAuthorIdClosure(Closure $authorId)
  {
    $this->authorIdClosure = $authorId;
  }

  /**
   * @return Closure
   */
  public function getAuthorIdClosure()
  {
    return $this->authorIdClosure;
  }


} 