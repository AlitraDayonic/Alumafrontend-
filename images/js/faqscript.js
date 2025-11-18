(function(){
  var dd = $('dd');

  //Hides all children except 1st
  dd.filter(':nth-child(n+3)').hide();

  //Instead of adding function to every single 'dt'
  //we add it to one single element 'dl' and then find the 'td' afterwards.
  $('dl').on('click', 'dt', function(){
    $(this)
      .next()
      .slideDown(200)
      .siblings('dd')
      .slideUp(200);
  })
})();