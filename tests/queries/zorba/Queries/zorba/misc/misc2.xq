declare function local:test($p)
{
 let $e := subsequence($p, 2, 1)
 for $param in $e//param
 return local:foo($param/value)
};


declare function local:foo($e) 
{
 $e
};

local:test((1,  <methodResponse>
 <params>
   <param>
     <value>
     Hello
     </value>
   </param>
 </params>
</methodResponse>))
