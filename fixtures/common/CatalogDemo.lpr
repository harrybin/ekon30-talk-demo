program CatalogDemo;

{$IFDEF FPC}{$MODE DELPHI}{$H+}{$ENDIF}

uses SessionData, SessionCatalog;

var
  Sessions: TSessions;
  Counts: TTrackCounts;
  I: Integer;
begin
  SetLength(Sessions, 4);
  Sessions[0].Track := 'KI';
  Sessions[1].Track := 'Delphi';
  Sessions[2].Track := 'KI';
  Sessions[3].Track := 'ki';

  WriteLn('Sessions: KI, Delphi, KI, ki');
  WriteLn('Sessions je Track:');
  Counts := CountSessionsByTrack(Sessions);
  for I := 0 to High(Counts) do
    WriteLn('  ', Counts[I].Track, ': ', Counts[I].Count);
  WriteLn('Erwartet: KI: 2, Delphi: 1, ki: 1');
end.
